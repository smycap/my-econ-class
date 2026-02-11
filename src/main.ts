import './style.css'

// 1. 데이터 초기화 (v6)
let students: any[] = JSON.parse(localStorage.getItem('econ_v6_students') || '[]');
let roles: any = JSON.parse(localStorage.getItem('econ_v6_roles') || JSON.stringify({ "기본": { pay: 1000, dept: "기본", task: "일반 업무" } }));
let treasury: any = JSON.parse(localStorage.getItem('econ_v6_treasury') || JSON.stringify({ totalTax: 0, weeklyTax: 0 }));
let shopItems: any[] = JSON.parse(localStorage.getItem('econ_v6_shop') || '[]');

let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const TAX_RATE = 0.1;

const app = document.querySelector<HTMLDivElement>('#app')!;

// --- 화면 1: 로그인 ---
function renderLogin() {
  app.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: sans-serif;">
      <h1>🏛️ 우리 반 경제 통합 시스템</h1>
      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: auto;">
        <input id="login-id" placeholder="이름" style="padding: 12px; border: 1px solid #ddd; border-radius: 5px;" />
        <input id="login-pw" type="password" placeholder="비밀번호" style="padding: 12px; border: 1px solid #ddd; border-radius: 5px;" />
        <button id="login-btn" style="padding: 12px; background: #646cff; color: white; border: none; border-radius: 5px; cursor: pointer;">로그인</button>
      </div>
    </div>
  `;
  document.querySelector('#login-btn')?.addEventListener('click', () => {
    const id = (document.querySelector('#login-id') as HTMLInputElement).value;
    const pw = (document.querySelector('#login-pw') as HTMLInputElement).value;
    if (id === 'admin' && pw === '1234') { currentUser = { name: '선생님', isAdmin: true }; render(); }
    else {
      const s = students.find(x => x.name === id);
      if (s && pw === id + "123") { currentUser = { ...s, isAdmin: false }; render(); }
      else { alert('정보가 틀렸습니다!'); }
    }
  });
}

// --- 화면 2: 메인 화면 ---
function render() {
  if (!currentUser) { renderLogin(); return; }

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1200px; margin: auto;">
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1; background: #212529; color: #fcc419; padding: 15px; border-radius: 10px; text-align: center;">
          <small>🏛️ 누적 국고</small><br><b>${treasury.totalTax.toLocaleString()}원</b>
        </div>
        <div style="flex: 1; background: #343a40; color: #74c0fc; padding: 15px; border-radius: 10px; text-align: center;">
          <small>📅 이번 주 세금</small><br><b>${treasury.weeklyTax.toLocaleString()}원</b>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>${currentUser.isAdmin ? '👨‍🏫 중앙 관리소' : '👤 ' + currentUser.name + '의 지갑'}</h2>
        <button id="logout-btn">로그아웃</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #fff0f6; padding: 15px; border-radius: 10px; border: 1px solid #ffdeeb;">
          <h3>🛒 학급 상점</h3>
          <div id="shop-list">${renderShop()}</div>
          ${currentUser.isAdmin ? `
            <div style="margin-top:10px;">
              <input id="item-name" placeholder="상품명" style="width:80px;">
              <input id="item-price" type="number" placeholder="가격" style="width:60px;">
              <button id="add-item-btn">추가</button>
            </div>
          ` : ''}
        </div>
        <div style="background: #f3f0ff; padding: 15px; border-radius: 10px; border: 1px solid #e5dbff;">
          <h3>💸 계좌 이체</h3>
          <select id="send-to"><option value="">받는 사람</option>
            ${students.filter(x => x.name !== currentUser.name).map(x => `<option value="${x.name}">${x.name}</option>`).join('')}
          </select>
          <input id="send-amount" type="number" placeholder="금액" style="width:80px;">
          <button id="send-btn">보내기</button>
        </div>
      </div>

      ${currentUser.isAdmin ? renderAdminUI() : renderStudentUI()}

      <h3>📊 전체 업무 및 자산 현황</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
          <tr style="background: #f1f3f5;">
            <th>부서</th><th>이름</th><th>직업</th><th>기본주급</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
            <th>주간수령액</th><th>현재잔고</th>${currentUser.isAdmin ? '<th>관리</th>' : ''}
          </tr>
          ${students.map((s, idx) => {
            const rInfo = roles[s.role] || { pay: 0, dept: '-' };
            const dailyNet = Math.floor((rInfo.pay / 5) * 0.9);
            const weeklyTotal = (s.checks || []).filter((v: any) => v).length * dailyNet;
            const canEdit = currentUser.isAdmin || (currentUser.dept === rInfo.dept && currentUser.isMinister);
            return `
              <tr style="text-align: center; border-bottom: 1px solid #eee;">
                <td>${rInfo.dept}</td>
                <td>${s.name}${s.isMinister ? '👑' : ''}</td>
                <td>${s.role}</td>
                <td>${rInfo.pay}</td>
                ${DAYS.map((_, dIdx) => `
                  <td><button onclick="window.toggleCheck(${idx}, ${dIdx})" ${!canEdit ? 'disabled' : ''} 
                    style="border-radius:50%; border:none; background:${s.checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; cursor:pointer;">
                    ${s.checks[dIdx] ? 'O' : 'X'}</button></td>
                `).join('')}
                <td style="color:#e67700; font-weight:bold;">${weeklyTotal}</td>
                <td style="font-weight:bold;">${s.balance.toLocaleString()}원</td>
                ${currentUser.isAdmin ? `<td><button onclick="window.adjustMoney(${idx})">+/-</button></td>` : ''}
              </tr>`;
          }).join('')}
        </table>
      </div>
    </div>
  `;
  setupEvents();
  saveData();
}

// --- 상점 렌더링 ---
function renderShop() {
  if (shopItems.length === 0) return '<p>상점이 비어있습니다.</p>';
  return shopItems.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; margin-bottom:5px; align-items:center;">
      <span>${item.name} (${item.price}원)</span>
      <button onclick="window.buyItem(${idx})" ${currentUser.isAdmin ? 'disabled' : ''}>구매</button>
      ${currentUser.isAdmin ? `<button onclick="window.removeItem(${idx})" style="background:gray;">삭제</button>` : ''}
    </div>
  `).join('');
}

function renderAdminUI() {
  return `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #dee2e6;">
      <h4>⚙️ 선생님 관리 메뉴</h4>
      <button id="add-student-btn">학생 추가</button>
      <button id="add-role-btn">직업 등록</button>
      <button id="reset-week-btn" style="background:#fa5252; color:white;">주간 초기화 및 정산</button>
      <p style="font-size:0.8rem; color:red;">* 주간 초기화 시 O 표시된 일급이 잔고에 최종 합산됩니다.</p>
    </div>
  `;
}

function renderStudentUI() {
  return `
    <div style="background: #e7f5ff; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; border: 2px solid #339af0;">
      <h2 style="margin:0;">내 잔고: ${currentUser.balance.toLocaleString()}원</h2>
    </div>
  `;
}

// --- 시스템 로직 ---
(window as any).toggleCheck = (sIdx: number, dIdx: number) => {
  students[sIdx].checks[dIdx] = !students[sIdx].checks[dIdx];
  render();
};

(window as any).buyItem = (iIdx: number) => {
  const item = shopItems[iIdx];
  const sIdx = students.findIndex(x => x.name === currentUser.name);
  if (students[sIdx].balance >= item.price) {
    students[sIdx].balance -= item.price;
    treasury.totalTax += item.price; // 상점 수익을 국고로!
    alert(`${item.name} 구매 완료!`);
    render();
  } else { alert('잔액이 부족합니다!'); }
};

(window as any).adjustMoney = (sIdx: number) => {
  const amount = parseInt(prompt(`${students[sIdx].name} 학생에게 얼마를 지급/차감할까요? (차감은 -입력)`) || '0');
  if (amount) {
    students[sIdx].balance += amount;
    render();
  }
};

(window as any).removeItem = (iIdx: number) => { shopItems.splice(iIdx, 1); render(); };

function setupEvents() {
  document.querySelector('#logout-btn')?.addEventListener('click', () => { currentUser = null; render(); });
  
  // 송금 기능
  document.querySelector('#send-btn')?.addEventListener('click', () => {
    const toName = (document.querySelector('#send-to') as HTMLSelectElement).value;
    const amount = parseInt((document.querySelector('#send-amount') as HTMLInputElement).value);
    const fromIdx = students.findIndex(x => x.name === currentUser.name);
    const toIdx = students.findIndex(x => x.name === toName);
    
    if (toIdx !== -1 && amount > 0 && students[fromIdx].balance >= amount) {
      students[fromIdx].balance -= amount;
      students[toIdx].balance += amount;
      alert(`${toName}에게 ${amount}원을 보냈습니다.`);
      render();
    } else { alert('송금 실패! (잔액 부족 또는 대상 미선택)'); }
  });

  // 상점 아이템 추가
  document.querySelector('#add-item-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#item-name') as HTMLInputElement).value;
    const price = parseInt((document.querySelector('#item-price') as HTMLInputElement).value);
    if (name && price) { shopItems.push({ name, price }); render(); }
  });

  // 주간 초기화 및 정산 (여기서 실제로 세금 떼고 돈이 들어감)
  document.querySelector('#reset-week-btn')?.addEventListener('click', () => {
    if (confirm('이번 주 업무 결과를 잔고에 정산하고 모든 체크를 초기화할까요?')) {
      students.forEach(s => {
        const rInfo = roles[s.role] || { pay: 0 };
        const dailyGross = Math.floor(rInfo.pay / 5);
        const tax = Math.floor(dailyGross * TAX_RATE);
        const dailyNet = dailyGross - tax;
        
        const okCount = s.checks.filter((v: any) => v).length;
        s.balance += (okCount * dailyNet); // 실제 돈 지급
        treasury.totalTax += (okCount * tax); // 국고 적립
        s.checks = [false, false, false, false, false];
      });
      treasury.weeklyTax = 0;
      render();
      alert('정산이 완료되었습니다!');
    }
  });

  // 학생/직업 추가는 이전과 동일 (생략 가능하나 기능은 유지)
  document.querySelector('#add-student-btn')?.addEventListener('click', () => {
    const n = prompt('이름'); const r = prompt('직업');
    if (n && r) { students.push({ name: n, role: r, balance: 0, checks: [false, false, false, false, false], isMinister: false, dept: roles[r]?.dept }); render(); }
  });
}

function saveData() {
  localStorage.setItem('econ_v6_students', JSON.stringify(students));
  localStorage.setItem('econ_v6_roles', JSON.stringify(roles));
  localStorage.setItem('econ_v6_treasury', JSON.stringify(treasury));
  localStorage.setItem('econ_v6_shop', JSON.stringify(shopItems));
}

render();
