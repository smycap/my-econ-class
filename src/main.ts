import './style.css'

// 1. 데이터 초기화 (로컬 스토리지 키값을 v10으로 업데이트하여 충돌 방지)
let allData: any = JSON.parse(localStorage.getItem('econ_v10_data') || '{}'); 
let currentMonth: string = localStorage.getItem('econ_v10_month') || new Date().toISOString().slice(0, 7);
let treasury: any = JSON.parse(localStorage.getItem('econ_v10_treasury') || '{"totalTax":0}');

let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; 
const FOOTER_TEXT = "made by smyteacher"; 

const app = document.querySelector<HTMLDivElement>('#app')!;

function getMonthData(month: string) {
  if (!allData[month]) allData[month] = { students: [], roles: [] };
  return allData[month];
}

// --- 화면 렌더링 ---
function render() {
  if (!currentUser) { renderLogin(); return; }
  const mData = getMonthData(currentMonth);
  const students = mData.students;

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1100px; margin: auto; min-height: 90vh; position: relative;">
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <button onclick="window.changeMonth(-1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">◀</button>
        <h2 style="margin:0; color:#333;">📅 ${currentMonth.split('-')[1]}월 - ${APP_TITLE}</h2>
        <button onclick="window.changeMonth(1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">▶</button>
      </div>

      <div style="background: #212529; color: #fcc419; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <small style="color:#adb5bd;">🏛️ 누적 국고 총액</small><br>
        <b style="font-size:1.8rem;">${treasury.totalTax.toLocaleString()}원</b>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin:0;">${currentUser.isAdmin ? '👨‍🏫 중앙 관리소' : '👤 ' + currentUser.name + ' 님 환영합니다'}</h3>
        <button id="logout-btn" style="padding:5px 15px; cursor:pointer;">로그아웃</button>
      </div>

      ${currentUser.isAdmin ? renderAdmin(mData) : renderStudent(students)}

      <div style="overflow-x: auto; margin-top:30px; border: 1px solid #dee2e6; border-radius: 10px;">
        <table style="width: 100%; border-collapse: collapse; min-width: 800px; background: white;">
          <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="padding:12px;">부서</th><th>이름</th><th>직업</th><th>주급</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
            <th>현재잔고</th>
          </tr>
          ${students.map((s: any, idx: number) => {
            const canEdit = currentUser.isAdmin || (s.dept === currentUser.dept && currentUser.isMinister);
            return `
              <tr style="text-align: center; border-bottom: 1px solid #eee;">
                <td style="padding:12px;">${s.dept}</td>
                <td>${s.name}${s.isMinister ? '👑' : ''}</td>
                <td>${s.role}</td>
                <td>${s.pay.toLocaleString()}</td>
                ${DAYS.map((_, dIdx) => `
                  <td><button onclick="window.toggleCheck(${idx}, ${dIdx})" ${!canEdit ? 'disabled' : ''} 
                    style="border-radius:50%; border:none; background:${s.checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; width:28px; height:28px; cursor:pointer;">
                    ${s.checks[dIdx] ? 'O' : 'X'}</button></td>
                `).join('')}
                <td style="font-weight:bold; color:#1c7ed6;">${s.balance.toLocaleString()}원</td>
              </tr>`;
          }).join('')}
        </table>
      </div>

      <footer style="margin-top: 60px; text-align: center; color: #adb5bd; font-size: 0.85rem; padding-bottom: 20px;">
        ${FOOTER_TEXT}
      </footer>
    </div>
  `;
  setupEvents();
}

function renderLogin() {
  app.innerHTML = `
    <div style="padding: 100px 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color:#339af0; font-size:2.5rem; margin-bottom:10px;">${APP_TITLE}</h1>
      <p style="color:#868e96; margin-bottom:40px;">우리 반의 즐거운 경제 활동 공간</p>
      <div style="max-width:320px; margin:auto; display:flex; flex-direction:column; gap:12px;">
        <input id="l-id" placeholder="성함 (또는 이름)" style="padding:12px; border:1px solid #ddd; border-radius:6px;">
        <input id="l-pw" type="password" placeholder="비밀번호" style="padding:12px; border:1px solid #ddd; border-radius:6px;">
        <button id="l-btn" style="padding:12px; background:#339af0; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">로그인</button>
      </div>
      <p style="margin-top:120px; color:#dee2e6; font-size:0.8rem;">${FOOTER_TEXT}</p>
    </div>`;
  document.querySelector('#l-btn')?.addEventListener('click', () => {
    const id = (document.querySelector('#l-id') as HTMLInputElement).value;
    const pw = (document.querySelector('#l-pw') as HTMLInputElement).value;
    if (id === 'admin' && pw === '1234') { currentUser = { name: '선생님', isAdmin: true }; render(); }
    else {
      const s = getMonthData(currentMonth).students.find((x:any)=>x.name===id);
      if (s && pw === id + "123") { currentUser = { ...s, isAdmin: false }; render(); }
      else { alert('정보가 올바르지 않습니다.'); }
    }
  });
}

function renderAdmin(mData: any) {
  return `
    <div style="background: #fff9db; padding: 20px; border-radius: 12px; border: 1px solid #fab005; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background:white; padding:15px; border-radius:8px;">
        <p style="margin-top:0;"><b>1. 직업 등록</b></p>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <input id="d" placeholder="부서 (예: 국세청)">
          <input id="r" placeholder="직업 (예: 조사관)">
          <input id="p" type="number" placeholder="주급 (예: 4000)">
          <button id="add-r-btn" style="background:#fcc419; border:none; padding:8px; cursor:pointer; border-radius:4px;">직업 리스트 추가</button>
        </div>
      </div>
      <div style="background:white; padding:15px; border-radius:8px;">
        <p style="margin-top:0;"><b>2. 학생 등록</b></p>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <input id="s-n" placeholder="학생 이름">
          <select id="r-s" style="padding:6px;">
            <option value="">-- 직업 선택 --</option>
            ${mData.roles.map((r:any, i:number) => `<option value="${i}">${r.role} (${r.dept})</option>`).join('')}
          </select>
          <button id="add-s-btn" style="background:#40c057; color:white; border:none; padding:8px; cursor:pointer; border-radius:4px;">학생 최종 등록</button>
        </div>
      </div>
      <div style="grid-column: span 2; text-align: center;">
        <button id="pay-btn" style="background:#228be6; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:bold;">💰 이번 주 월급 정산 (세금 10% 자동 공제)</button>
      </div>
    </div>`;
}

function renderStudent(students: any[]) {
  const my = students.find((x:any)=>x.name===currentUser.name);
  return `
    <div style="background:#e7f5ff; padding:25px; border-radius:12px; text-align:center; border:2px solid #339af0;">
      <p style="margin:0; color:#1971c2;">나의 현재 자산</p>
      <h2 style="font-size:2.2rem; margin:10px 0; color:#1864ab;">${my?.balance.toLocaleString() || 0}원</h2>
      <p style="margin:0; color:#4dabf7;">직업: ${my?.role || '미등록'}</p>
    </div>`;
}

// --- 공통 로직 ---
(window as any).changeMonth = (val: number) => {
  let [y, m] = currentMonth.split('-').map(Number);
  m += val;
  if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
  currentMonth = `${y}-${String(m).padStart(2, '0')}`;
  localStorage.setItem('econ_v10_month', currentMonth);
  render();
};

(window as any).toggleCheck = (sIdx: number, dIdx: number) => {
  const mData = getMonthData(currentMonth);
  mData.students[sIdx].checks[dIdx] = !mData.students[sIdx].checks[dIdx];
  saveData(); render();
};

function setupEvents() {
  document.querySelector('#logout-btn')?.addEventListener('click', () => { currentUser = null; render(); });
  const mData = getMonthData(currentMonth);

  document.querySelector('#add-r-btn')?.addEventListener('click', () => {
    const dept = (document.querySelector('#d') as HTMLInputElement).value;
    const role = (document.querySelector('#r') as HTMLInputElement).value;
    const pay = parseInt((document.querySelector('#p') as HTMLInputElement).value);
    if (dept && role && pay) { mData.roles.push({ dept, role, pay }); saveData(); render(); }
  });

  document.querySelector('#add-s-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#s-n') as HTMLInputElement).value;
    const rIdx = (document.querySelector('#r-s') as HTMLSelectElement).value;
    if (name && rIdx) {
      const r = mData.roles[parseInt(rIdx)];
      mData.students.push({ name, role: r.role, dept: r.dept, pay: r.pay, balance: 0, checks: [false,false,false,false,false] });
      saveData(); render();
    }
  });

  document.querySelector('#pay-btn')?.addEventListener('click', () => {
    if (confirm('이번 주 정산을 시작할까요? (출근 횟수에 맞춰 월급이 지급됩니다)')) {
      mData.students.forEach((s:any) => {
        const daily = (s.pay / 5);
        const count = s.checks.filter((v:any)=>v).length;
        s.balance += Math.floor(daily * 0.9 * count);
        treasury.totalTax += Math.floor(daily * 0.1 * count);
        s.checks = [false,false,false,false,false];
      });
      saveData(); render();
    }
  });
}

function saveData() {
  localStorage.setItem('econ_v10_data', JSON.stringify(allData));
  localStorage.setItem('econ_v10_treasury', JSON.stringify(treasury));
}
render();