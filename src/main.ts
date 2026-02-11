import './style.css'

let allData: any = JSON.parse(localStorage.getItem('econ_v9_all_months') || '{}'); 
let currentMonth: string = localStorage.getItem('econ_v9_view_month') || new Date().toISOString().slice(0, 7);
let treasury: any = JSON.parse(localStorage.getItem('econ_v9_treasury') || JSON.stringify({ totalTax: 0, weeklyTax: 0 }));

let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const TAX_RATE = 0.1;
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; 
const FOOTER_TEXT = "made by smyteacher"; 

const app = document.querySelector<HTMLDivElement>('#app')!;

function getMonthData(month: string) {
  if (!allData[month]) allData[month] = { students: [], roles: [] };
  return allData[month];
}

function render() {
  if (!currentUser) { renderLogin(); return; }
  const monthData = getMonthData(currentMonth);
  const { students } = monthData;

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1200px; margin: auto; min-height: 90vh;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 10px; border-radius: 10px;">
        <button onclick="window.changeMonth(-1)" style="border:none; cursor:pointer; background:none; font-size:1.2rem;">◀</button>
        <h2 style="margin:0;">${currentMonth.split('-')[1]}월 - ${APP_TITLE}</h2>
        <button onclick="window.changeMonth(1)" style="border:none; cursor:pointer; background:none; font-size:1.2rem;">▶</button>
      </div>

      <div style="background: #212529; color: #fcc419; padding: 15px; border-radius: 10px; text-align: center; margin-bottom:20px;">
        <small>🏛️ 누적 국고 총액</small><br><b style="font-size:1.5rem;">${treasury.totalTax.toLocaleString()}원</b>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3>${currentUser.isAdmin ? '👨‍🏫 중앙 관리소' : '👤 ' + currentUser.name + ' 님'}</h3>
        <button id="logout-btn">로그아웃</button>
      </div>

      ${currentUser.isAdmin ? renderAdminSection(monthData) : `<h2>현재 내 자산: ${students.find((x:any)=>x.name===currentUser.name)?.balance.toLocaleString() || 0}원</h2>`}

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
      <footer style="margin-top: 50px; text-align: center; color: #adb5bd; font-size: 0.9rem; padding: 20px;">${FOOTER_TEXT}</footer>
    </div>
  `;
  setupEvents();
}

function renderLogin() {
  app.innerHTML = `
    <div style="padding: 100px 20px; text-align: center; font-family: sans-serif;">
      <h1>${APP_TITLE}</h1>
      <div style="max-width:300px; margin:auto; display:flex; flex-direction:column; gap:10px;">
        <input id="login-id" placeholder="이름" style="padding:12px; border:1px solid #dee2e6; border-radius:5px;">
        <input id="login-pw" type="password" placeholder="비밀번호" style="padding:12px; border:1px solid #dee2e6; border-radius:5px;">
        <button id="login-btn" style="padding:12px; background:#339af0; color:white; border:none; border-radius:5px; cursor:pointer;">로그인</button>
      </div>
      <p style="margin-top:100px; color:#dee2e6;">${FOOTER_TEXT}</p>
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
      else { alert('정보를 확인해주세요!'); }
    }
  });
}

function renderAdminSection(monthData: any) {
  const { roles } = monthData;
  return `
    <div style="background: #fff9db; padding: 20px; border-radius: 15px; border: 1px solid #fab005; margin-bottom: 20px;">
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background:white; padding:15px; border-radius:10px;">
          <p><b>1. 직업 등록</b></p>
          <input id="new-dept" placeholder="부서"> <input id="new-role" placeholder="직업"> <input id="new-pay" type="number" placeholder="주급">
          <button id="save-role-btn">추가</button>
        </div>
        <div style="background:white; padding:15px; border-radius:10px;">
          <p><b>2. 학생 등록</b></p>
          <input id="new-student-name" placeholder="학생 이름">
          <select id="role-select"><option value="">직업선택</option>${roles.map((r:any, i:number) => `<option value="${i}">${r.role}</option>`).join('')}</select>
          <button id="add-student-btn">등록</button>
        </div>
      </div>
      <div style="text-align:center; margin-top:20px;"><button id="reset-week-btn" style="background:#228be6; color:white; padding:10px; border:none; border-radius:8px;">💰 주간 정산</button></div>
    </div>
  `;
}

(window as any).changeMonth = (val: number) => {
  let [y, m] = currentMonth.split('-').map(Number);
  m += val;
  if (m > 12) { m = 1; y++; }
  if (m < 1) { m = 12; y--; }
  currentMonth = `${y}-${String(m).padStart(2, '0')}`;
  localStorage.setItem('econ_v9_view_month', currentMonth);
  render();
};

(window as any).toggleCheck = (sIdx: number, dIdx: number) => {
  const mData = getMonthData(currentMonth);
  mData.students[sIdx].checks[dIdx] = !mData.students[sIdx].checks[dIdx];
  saveData();
  render();
};

function setupEvents() {
  document.querySelector('#logout-btn')?.addEventListener('click', () => { currentUser = null; render(); });
  const mData = getMonthData(currentMonth);
  document.querySelector('#save-role-btn')?.addEventListener('click', () => {
    const dept = (document.querySelector('#new-dept') as HTMLInputElement).value;
    const role = (document.querySelector('#new-role') as HTMLInputElement).value;
    const pay = parseInt((document.querySelector('#new-pay') as HTMLInputElement).value);
    if (dept && role && pay) { mData.roles.push({ dept, role, pay }); saveData(); render(); }
  });
  document.querySelector('#add-student-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#new-student-name') as HTMLInputElement).value;
    const roleIdx = (document.querySelector('#role-select') as HTMLSelectElement).value;
    if (name && roleIdx) {
      const r = mData.roles[parseInt(roleIdx)];
      mData.students.push({ name, role: r.role, dept: r.dept, roleDetail: r, balance: 0, checks: [false,false,false,false,false] });
      saveData(); render();
    }
  });
  document.querySelector('#reset-week-btn')?.addEventListener('click', () => {
    if (confirm('정산할까요?')) {
      mData.students.forEach((s:any) => {
        const daily = Math.floor((s.roleDetail?.pay || 0) / 5 * 0.9);
        const count = s.checks.filter((v:any) => v).length;
        s.balance += (daily * count);
        treasury.totalTax += (Math.floor((s.roleDetail?.pay || 0) / 5 * 0.1) * count);
        s.checks = [false,false,false,false,false];
      });
      saveData(); render();
    }
  });
}

function saveData() {
  localStorage.setItem('econ_v9_all_months', JSON.stringify(allData));
  localStorage.setItem('econ_v9_treasury', JSON.stringify(treasury));
}

render();