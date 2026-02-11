import './style.css'

// 1. 데이터 로드 및 초기화
let allData: any = JSON.parse(localStorage.getItem('econ_v9_all_months') || '{}'); 
let currentMonth: string = localStorage.getItem('econ_v9_view_month') || new Date().toISOString().slice(0, 7);
let treasury: any = JSON.parse(localStorage.getItem('econ_v9_treasury') || JSON.stringify({ totalTax: 0, weeklyTax: 0 }));

let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const TAX_RATE = 0.1;
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; // 제목 설정
const FOOTER_TEXT = "made by smyteacher"; // 하단 문구

const app = document.querySelector<HTMLDivElement>('#app')!;

function getMonthData(month: string) {
  if (!allData[month]) allData[month] = { students: [], roles: [] };
  return allData[month];
}

// --- 화면 렌더링 ---
function render() {
  if (!currentUser) { renderLogin(); return; }

  const monthData = getMonthData(currentMonth);
  const { students } = monthData;

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1200px; margin: auto; min-height: 90vh;">
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 10px; border-radius: 10px;">
        <button onclick="window.changeMonth(-1)" style="border:none; cursor:pointer; background:none; font-size:1.2rem;">◀</button>
        <h2 style="margin:0;">${currentMonth.split('-')[1]}월 활동 - ${APP_TITLE}</h2>
        <button onclick="window.changeMonth(1)" style="border:none; cursor:pointer; background:none; font-size:1.2rem;">▶</button>
      </div>

      <div style="background: #212529; color: #fcc419; padding: 15px; border-radius: 10px; text-align: center; margin-bottom:20px;">
        <small>🏛️ 누적 국고 총액</small><br><b style="font-size:1.5rem;">${treasury.totalTax.toLocaleString()}원</b>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3>${currentUser.isAdmin ? '👨‍🏫 중앙 관리소' : '👤 ' + currentUser.name + ' 님 환영합니다'}</h3>
        <button id="logout-btn">로그아웃</button>
      </div>

      ${currentUser.isAdmin ? renderAdminSection(monthData) : renderStudentUI(students)}

      <div style="overflow-x: auto; margin-top:30px;">
        <table style="width: 100%; border-collapse: collapse; min-width: 900px; background: white; border-radius:10px; overflow:hidden;">
          <tr style="background: #dee2e6;">
            <th>부서</th><th>이름</th><th>직업</th><th>주급</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
            <th>현재잔고</th>
          </tr>
          ${students.map((s: any, idx: number) => {
            const r = s.roleDetail || { dept: '-', pay: 0 };
            const canEdit = currentUser.isAdmin || (s.dept === currentUser.dept && currentUser.isMinister);
            return `
              <tr style="text-align: center; border-bottom: 1px solid #eee;">
                <td style="padding:12px;">${r.dept}</td>
                <td>${s.name}${s.isMinister ? '👑' : ''}</td>
                <td>${s.role}</td>
                <td>${r.pay.toLocaleString()}</td>
                ${DAYS.map((_, dIdx) => `
                  <td><button onclick="window.toggleCheck(${idx}, ${dIdx})" ${!canEdit ? 'disabled' : ''} 
                    style="border-radius:50%; border:none; background:${s.checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; width:30px; height:30px; cursor:pointer;">
                    ${s.checks[dIdx] ? 'O' : 'X'}</button></td>
                `).join('')}
                <td style="font-weight:bold;">${s.balance.toLocaleString()}원</td>
              </tr>`;
          }).join('')}
        </table>
      </div>

      <footer style="margin-top: 50px; text-align: center; color: #adb5bd; font-size: 0.9rem; padding: 20px;">
        ${FOOTER_TEXT}
      </footer>
    </div>
  `;
  setupEvents();
  saveData();
}

// --- 로그인 화면 (제목 수정) ---
function renderLogin() {
  app.innerHTML = `
    <div style="padding: 100px 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color:#339af0; margin-bottom:10px;">${APP_TITLE}</h1>
      <p style="color:#868e96; margin-bottom:40px;">우리 반의 즐거운 경제 활동 공간</p>
      <div style="max-width:300px; margin:auto; display:flex; flex-direction:column; gap:10px;">
        <input id="login-id" placeholder="성함 (또는 이름)" style="padding:12px; border:1px solid #dee2e6; border-radius:5px;">
        <input id="login-pw" type="password" placeholder="비밀번호" style="padding:12px; border:1px solid #dee2e6; border-radius:5px;">
        <button id="login-btn" style="padding:12px; background:#339af0; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">로그인</button>
      </div>
      <p style="margin-top:100px; color:#dee2e6; font-size:0.8rem;">${FOOTER_TEXT}</p>
    </div>
  `;
  document.querySelector('#login-btn')?.addEventListener('click', () => {
    const id = (document.querySelector('#login-id') as HTMLInputElement).value;
    const pw = (document.querySelector('#login-pw') as HTMLInputElement).value;
    if (id === 'admin' && pw === '1234') { currentUser = { name: '선생님', isAdmin: true }; render(); }
    else {
      const mData = getMonthData(currentMonth);
      const s = mData.students.find((x:any) => x.name === id);
      if (s && pw === id + "123") { currentUser = { ...s, isAdmin: false }; render(); }
      else { alert('일치하는 정보가 없습니다. 이름을 확인해주세요!'); }
    }
  });
}

function renderStudentUI(students: any[]) {
  const myData = students.find((x:any)=>x.name===currentUser.name);
  return `
    <div style="background:#e7f5ff; padding:30px; border-radius:15px; text-align:center; margin-bottom:30px; border:2px solid #339af0;">
      <p style="margin:0; color:#1971c2;">현재 나의 보유 자산</p>
      <h2 style="font-size:2.5rem; margin:10px 0; color:#1864ab;">${myData?.balance.toLocaleString() || 0}원</h2>
      <p style="margin:0; font-size:0.9rem; color:#4dabf7;">직업: ${myData?.role || '미정'}</p>
    </div>
  `;
}

function renderAdminSection(monthData: any) {
  const { roles } = monthData;
  return `
    <div style="background: #fff9db; padding: 20px; border-radius: 15px; border: 1px solid #fab005; margin-bottom: 20px;">
      <h4 style="margin-top:0;">🛠️ ${currentMonth.split('-')[1]}월 관리자 도구</h4>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background:white; padding:15px; border-radius:10px;">
          <p><b>1. 직업 사전 등록</b></p>
          <div style="display:grid; gap:5px;">
            <input id="new-dept" placeholder="부서 (예: 법무부)">
            <input id="new-role" placeholder="직업 (예: 판사)">
            <input id="new-pay" type="number" placeholder="주급 (예: 5000)">
            <button id="save-role-btn" style="background:#fcc419; border:none; padding:8px; border-radius:5px; cursor:pointer;">목록에 추가</button>
          </div>
          <div style="font-size:0.8rem; margin-top:10px; color:#666;">등록된 직업: ${roles.length}개</div>
        </div>
        <div style="background:white; padding:15px; border-radius:10px;">
          <p><b>2. 학생 등록</b></p>
          <div style="display:grid; gap:5px;">
            <input id="new-student-name" placeholder="학생 이름">
            <select id="role-select" style="padding:5px;">
              <option value="">-- 직업 선택 --</option>
              ${roles.map((r:any, i:number) => `<option value="${i}">${r.role} (${r.dept})</option>`).join('')}
            </select>
            <label style="font-size:0.8rem;"><input type="checkbox" id="is-minister"> 부서장(장관) 권한</label>
            <button id="add-student-btn" style="background:#40c057; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">학생 추가 완료</button>
          </div>
        </div>
      </div>
      <hr style="border:0.5px solid #ffe066; margin:20px 0;">
      <div style="display:flex; gap:10px; justify-content: center;">
        <button id="reset-week-btn" style="background:#228be6; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">💰 주간 정산 및 초기화</button>
        <button onclick="window.startNewMonth()" style="background:#fa5252; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">📅 새로운 달 시작하기</button>
      </div>
    </div>
  `;
}

// --- 공통 로직 (저장 및 이벤트) ---
(window as any).changeMonth = (val: number) => {
  let [y, m] = currentMonth.split('-').map(Number);
  m += val;
  if (m > 12) { m = 1; y++; }
  if (m < 1) { m = 12; y--; }
  currentMonth = `${y}-${String(m).padStart(2, '0')}`;
  localStorage.setItem('econ_v9_view_month', currentMonth);
  render();
};

(window as any).startNewMonth = () => {
  const nextMonth = prompt("새로 시작할 년-월을 입력하세요", "2024-04");
  if (nextMonth) {
    const prevData = getMonthData(currentMonth);
    allData[nextMonth] = {
      students: prevData.students.map((s:any) => ({...s, checks: [false,false,false,false,false]})),
      roles: [...prevData.roles]
    };
    currentMonth = nextMonth;
    render();
  }
};

(window as any).toggleCheck = (sIdx: number, dIdx: number) => {
  const mData = getMonthData(currentMonth);
  mData.students[sIdx].checks[dIdx] = !mData.students[sIdx].checks[dIdx];
  render();
};

function setupEvents() {
  document.querySelector('#logout-btn')?.addEventListener('click', () => { currentUser = null; render(); });
  const mData = getMonthData(currentMonth);

  document.querySelector('#save-role-btn')?.addEventListener('click', () => {
    const dept = (document.querySelector('#new-dept') as HTMLInputElement).value;
    const role = (document.querySelector('#new-role') as HTMLInputElement).value;
    const pay = parseInt((document.querySelector('#new-pay') as HTMLInputElement).value);
    if (dept && role && pay) { mData.roles.push({ dept, role, pay }); render(); }
  });

  document.querySelector('#add-student-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#new-student-name') as HTMLInputElement).value;
    const roleIdx = (document.querySelector('#role-select') as HTMLSelectElement).value;
    const isMin = (document.querySelector('#is-minister') as HTMLInputElement).checked;
    if (name && roleIdx) {
      const r = mData.roles[parseInt(roleIdx)];
      mData.students.push({
        name, role: r.role, dept: r.dept, roleDetail: r, isMinister: isMin,
        balance: 0, checks: [false,false,false,false,false]
      });
      render();
    }
  });

  document.querySelector('#reset-week-btn')?.addEventListener('click', () => {
    if (confirm('이번 주 기록을 정산할까요? (돈이 실제 지급됩니다)')) {
      mData.students.forEach((s:any) => {
        const daily = Math.floor((s.roleDetail?.pay || 0) / 5 * 0.9);
        const count = s.checks.filter((v:any) => v).length;
        s.balance += (daily * count);
        treasury.totalTax += (Math.floor((s.roleDetail?.pay || 0) / 5 * 0.1) * count);
        s.checks = [false,false,false,false,false];
      });
      render();
    }
  });
}

function saveData() {
  localStorage.setItem('econ_v9_all_months', JSON.stringify(allData));
  localStorage.setItem('econ_v9_treasury', JSON.stringify(treasury));
}

render();