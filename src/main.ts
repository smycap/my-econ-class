import './style.css'

// 데이터 저장 구조 (v14)
let db: any = JSON.parse(localStorage.getItem('econ_v14_db') || JSON.stringify({
  globalRoles: [],
  globalStudents: [],
  weeklyActivity: {}, 
  treasury: { totalTax: 0 },
  totalWithdrawn: 0
}));

let currentView: string = localStorage.getItem('econ_v14_view') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-W1`;
let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; 

const app = document.querySelector<HTMLDivElement>('#app')!;

function getWeeklyActivity(viewKey: string) {
  if (!db.weeklyActivity[viewKey]) db.weeklyActivity[viewKey] = { checks: {}, isPaid: false };
  return db.weeklyActivity[viewKey];
}

function getEconomyStats() {
  const activity = getWeeklyActivity(currentView);
  let expectedWeeklyTax = 0;
  let totalStudentBalance = 0;
  db.globalStudents.forEach((s: any) => {
    const checks = activity.checks[s.name] || [false, false, false, false, false];
    const count = checks.filter((v: any) => v).length;
    expectedWeeklyTax += Math.floor((s.pay / 5) * 0.1 * count);
    totalStudentBalance += s.balance;
  });
  return { expectedWeeklyTax, totalStudentBalance, isPaid: activity.isPaid };
}

function render() {
  if (!currentUser) { renderLogin(); return; }
  const activity = getWeeklyActivity(currentView);
  const { expectedWeeklyTax, totalStudentBalance, isPaid } = getEconomyStats();

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1100px; margin: auto;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 15px; border-radius: 12px;">
        <button onclick="window.changeWeek(-1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">◀</button>
        <h2 style="margin:0;">📅 ${currentView.split('-')[1]}월 ${currentView.split('-')[2].replace('W','')}주차 ${isPaid ? '<span style="color:#40c057; font-size:0.9rem;">[정산완료]</span>' : ''}</h2>
        <button onclick="window.changeWeek(1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">▶</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: #212529; color: #fcc419; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="color:#adb5bd;">🏛️ 누적 국고</small><br><b>${db.treasury.totalTax.toLocaleString()}원</b>
        </div>
        <div style="background: #e67e22; color: white; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="opacity:0.8;">💰 이번 주 예상 세수</small><br><b>+ ${expectedWeeklyTax.toLocaleString()}원</b>
        </div>
        <div style="background: #27ae60; color: white; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="opacity:0.8;">💸 유통 통화량</small><br><b>${totalStudentBalance.toLocaleString()}원</b>
        </div>
      </div>

      ${currentUser.isAdmin ? renderAdminSection() : renderStudentSection()}

      <div style="overflow-x: auto; margin-top:30px; border-radius: 10px; border: 1px solid #dee2e6;">
        <table style="width: 100%; border-collapse: collapse; background: white; table-layout: fixed;">
          <thead style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <tr>
              <th style="padding:15px; text-align:center; width: 100px;">부서</th>
              <th style="padding:15px; text-align:center; width: 100px;">이름</th>
              <th style="padding:15px; text-align:center; width: 120px;">직업</th>
              <th style="padding:15px; text-align:center; width: 100px;">주급</th>
              ${DAYS.map(d => `<th style="padding:15px; text-align:center; width: 60px;">${d}</th>`).join('')}
              <th style="padding:15px; text-align:center; width: 130px;">현재잔고</th>
            </tr>
          </thead>
          <tbody>
          ${db.globalStudents.map((s: any) => {
            const checks = activity.checks[s.name] || [false, false, false, false, false];
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:12px; text-align:center;">${s.dept}</td>
                <td style="padding:12px; text-align:center;">${s.name}</td>
                <td style="padding:12px; text-align:center;">${s.role}</td>
                <td style="padding:12px; text-align:center;">${s.pay.toLocaleString()}</td>
                ${DAYS.map((_, dIdx) => `
                  <td style="padding:12px; text-align:center;">
                    <div style="display: flex; justify-content: center; align-items: center;">
                      <button onclick="window.toggleCheck('${s.name}', ${dIdx})" ${(!currentUser.isAdmin || isPaid) ? 'disabled' : ''} 
                        style="border-radius:50%; border:none; background:${checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; width:32px; height:32px; cursor:pointer; font-weight:bold; display:flex; justify-content:center; align-items:center; line-height: 0;">
                        ${checks[dIdx] ? 'O' : 'X'}</button>
                    </div>
                  </td>
                `).join('')}
                <td style="padding:12px; text-align:center; font-weight:bold; color:#1c7ed6;">${s.balance.toLocaleString()}원</td>
              </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  setupEvents();
}

function renderLogin() {
  app.innerHTML = `<div style="padding:100px; text-align:center;"><h1>${APP_TITLE}</h1><input id="l-id" placeholder="이름" style="padding:10px; margin-bottom:10px;"><br><input id="l-pw" type="password" placeholder="비밀번호" style="padding:10px; margin-bottom:10px;"><br><button id="l-btn" style="padding:10px 20px;">로그인</button></div>`;
  document.querySelector('#l-btn')?.addEventListener('click', () => {
    const id = (document.querySelector('#l-id') as HTMLInputElement).value;
    const pw = (document.querySelector('#l-pw') as HTMLInputElement).value;
    if (id === 'admin' && pw === '1234') { currentUser = { name: '선생님', isAdmin: true }; render(); }
    else {
      const s = db.globalStudents.find((x:any)=>x.name===id);
      if (s && pw === id + "123") { currentUser = { ...s, isAdmin: false }; render(); }
      else { alert('정보 확인!'); }
    }
  });
}

function renderAdminSection() {
  const activity = getWeeklyActivity(currentView);
  return `
    <div style="background: #fff9db; padding: 20px; border-radius: 12px; border: 1px solid #fab005; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background:white; padding:15px; border-radius:8px; display:flex; flex-direction:column; justify-content: space-between;">
        <p style="margin:0 0 10px 0;"><b>👤 학생 정보 수정 (잔고 유지)</b></p>
        <select id="edit-s-idx" style="width:100%; padding:8px; margin-bottom:10px;">
          <option value="">수정할 학생 선택</option>
          ${db.globalStudents.map((s:any, i:number) => `<option value="${i}">${s.name} (${s.role})</option>`).join('')}
        </select>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px; margin-bottom:10px;">
          <input id="edit-dept" placeholder="부서" style="padding:5px;">
          <input id="edit-role" placeholder="직업" style="padding:5px;">
          <input id="edit-pay" type="number" placeholder="주급" style="padding:5px;">
        </div>
        <button id="edit-s-btn" style="width:100%; background:#fd7e14; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">수정 완료</button>
      </div>

      <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
        <p style="margin:0 0 10px 0;"><b>🛠️ 주간 관리 & 데이터</b></p>
        <button id="pay-btn" ${activity.isPaid ? 'disabled' : ''} style="background:#228be6; color:white; border:none; padding:12px; border-radius:5px; width:100%; cursor:pointer; font-weight:bold; margin-bottom:10px;">
          ${activity.isPaid ? '✅ 이번 주 정산 완료' : '💰 이번 주 월급 지급하기'}
        </button>
        <div style="display:flex; gap:5px; margin-bottom:10px;">
          <select id="withdraw-s-idx" style="flex:1;"><option value="">회수 학생</option>${db.globalStudents.map((s:any, i:number) => `<option value="${i}">${s.name}</option>`).join('')}</select>
          <input id="withdraw-amt" type="number" placeholder="금액" style="width:70px;">
          <button id="withdraw-btn" style="background:#fa5252; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">회수</button>
        </div>
        <div style="display:flex; justify-content:center; gap:10px; font-size:0.8rem;">
          <button id="export-btn" style="cursor:pointer;">💾 백업</button>
          <label style="cursor:pointer; background:#eee; padding:2px 8px; border-radius:3px;">📂 복구<input type="file" id="import-btn" style="display:none;"></label>
          <button id="logout-btn" style="cursor:pointer;">로그아웃</button>
        </div>
      </div>

      <div style="grid-column: span 2; background:white; padding:15px; border-radius:8px; border: 1px dashed #fab005;">
        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
          <b style="min-width: 80px; color: #e67e22;">1. 직업 추가:</b>
          부서 <input id="d" style="width:80px; padding:5px;">
          직업 <input id="r" style="width:100px; padding:5px;">
          주급 <input id="p" type="number" style="width:80px; padding:5px;">
          <button id="add-r-btn" style="background: #495057; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer;">직업 추가</button>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">

        <div style="display: flex; align-items: center; gap: 10px;">
          <b style="min-width: 80px; color: #228be6;">2. 학생 등록:</b>
          이름 <input id="s-n" style="width:80px; padding:5px;">
          직업 선택 
          <select id="r-s" style="padding:5px; min-width: 150px;">
            ${db.globalRoles.map((r:any, i:number) => `<option value="${i}">${r.role} (${r.dept})</option>`).join('')}
          </select>
          <button id="add-s-btn" style="background: #228be6; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer;">학생 등록</button>
        </div>
      </div>
    </div>`;
}

function renderStudentSection() {
  const my = db.globalStudents.find((x:any)=>x.name===currentUser.name);
  return `<div style="display:flex; justify-content:space-between; align-items:center; background:#e7f5ff; padding:20px; border-radius:12px; border:2px solid #339af0;"><h2>내 잔고: ${my?.balance.toLocaleString()}원</h2><button id="logout-btn">로그아웃</button></div>`;
}

// 나머지 로직(changeWeek, toggleCheck, setupEvents 등)은 동일하게 유지
(window as any).changeWeek = (val: number) => {
  let [y, m, w] = currentView.split('-');
  let month = parseInt(m); let week = parseInt(w.replace('W',''));
  week += val;
  if (week > 5) { week = 1; month++; } else if (week < 1) { week = 5; month--; }
  if (month > 12) { month = 3; } else if (month < 3) { month = 12; }
  currentView = `${y}-${String(month).padStart(2, '0')}-W${week}`;
  localStorage.setItem('econ_v14_view', currentView);
  render();
};

(window as any).toggleCheck = (name: string, dIdx: number) => {
  const activity = getWeeklyActivity(currentView);
  if (activity.isPaid) return;
  if (!activity.checks[name]) activity.checks[name] = [false, false, false, false, false];
  activity.checks[name][dIdx] = !activity.checks[name][dIdx];
  saveData(); render();
};

function setupEvents() {
  document.querySelectorAll('#logout-btn').forEach(b => b.addEventListener('click', () => { currentUser = null; render(); }));
  document.querySelector('#edit-s-btn')?.addEventListener('click', () => {
    const sIdx = (document.querySelector('#edit-s-idx') as HTMLSelectElement).value;
    const newDept = (document.querySelector('#edit-dept') as HTMLInputElement).value;
    const newRole = (document.querySelector('#edit-role') as HTMLInputElement).value;
    const newPay = parseInt((document.querySelector('#edit-pay') as HTMLInputElement).value);
    if (sIdx !== "" && newDept && newRole && newPay) {
      const s = db.globalStudents[parseInt(sIdx)];
      s.dept = newDept; s.role = newRole; s.pay = newPay;
      saveData(); render(); alert('수정 완료!');
    }
  });
  document.querySelector('#withdraw-btn')?.addEventListener('click', () => {
    const sIdx = (document.querySelector('#withdraw-s-idx') as HTMLSelectElement).value;
    const amt = parseInt((document.querySelector('#withdraw-amt') as HTMLInputElement).value);
    if (sIdx !== "" && amt > 0) {
      const s = db.globalStudents[parseInt(sIdx)];
      if (s.balance >= amt) { s.balance -= amt; db.totalWithdrawn += amt; saveData(); render(); }
    }
  });
  document.querySelector('#add-r-btn')?.addEventListener('click', () => {
    const dept = (document.querySelector('#d') as HTMLInputElement).value;
    const role = (document.querySelector('#r') as HTMLInputElement).value;
    const pay = parseInt((document.querySelector('#p') as HTMLInputElement).value);
    if (dept && role && pay) { db.globalRoles.push({ dept, role, pay }); saveData(); render(); }
  });
  document.querySelector('#add-s-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#s-n') as HTMLInputElement).value;
    const rIdx = (document.querySelector('#r-s') as HTMLSelectElement).value;
    if (name && rIdx) {
      const r = db.globalRoles[parseInt(rIdx)];
      db.globalStudents.push({ name, role: r.role, dept: r.dept, pay: r.pay, balance: 0 });
      saveData(); render();
    }
  });
  document.querySelector('#pay-btn')?.addEventListener('click', () => {
    const activity = getWeeklyActivity(currentView);
    if (activity.isPaid) return;
    if (confirm('정산을 완료하시겠습니까?')) {
      db.globalStudents.forEach((s: any) => {
        const checks = activity.checks[s.name] || [false,false,false,false,false];
        const count = checks.filter((v: any) => v).length;
        s.balance += Math.floor((s.pay / 5) * 0.9 * count);
        db.treasury.totalTax += Math.floor((s.pay / 5) * 0.1 * count);
      });
      activity.isPaid = true; saveData(); render();
    }
  });
  document.querySelector('#export-btn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `경제교실_백업_v14.json`; a.click();
  });
  document.querySelector('#import-btn')?.addEventListener('change', (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => { db = JSON.parse(ev.target.result); saveData(); location.reload(); };
    reader.readAsText(file);
  });
}

function saveData() {
  localStorage.setItem('econ_v14_db', JSON.stringify(db));
}
render();