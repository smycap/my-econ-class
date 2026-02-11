import './style.css'

// 데이터 저장 구조 (v13)
let db: any = JSON.parse(localStorage.getItem('econ_v13_db') || JSON.stringify({
  globalRoles: [],
  globalStudents: [],
  weeklyActivity: {}, // 이제 월별이 아닌 주차별(예: "2026-03-W1")로 저장됩니다.
  treasury: { totalTax: 0 },
  totalWithdrawn: 0
}));

// 현재 날짜 기준으로 초기 주차 설정 (예: 2026-03-W1)
let currentView: string = localStorage.getItem('econ_v13_view') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-W1`;
let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; 

const app = document.querySelector<HTMLDivElement>('#app')!;

// 특정 주차의 활동 데이터 가져오기
function getWeeklyActivity(viewKey: string) {
  if (!db.weeklyActivity[viewKey]) db.weeklyActivity[viewKey] = { checks: {}, isPaid: false };
  return db.weeklyActivity[viewKey];
}

// 실시간 경제 지표 계산
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
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <button onclick="window.changeWeek(-1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">◀</button>
        <h2 style="margin:0; color:#333;">📅 ${currentView.split('-')[1]}월 ${currentView.split('-')[2].replace('W','')}주차 ${isPaid ? '<span style="color:#40c057; font-size:0.9rem;">[정산완료]</span>' : ''}</h2>
        <button onclick="window.changeWeek(1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">▶</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: #212529; color: #fcc419; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="color:#adb5bd;">🏛️ 누적 국고 총액</small><br>
          <b style="font-size:1.4rem;">${db.treasury.totalTax.toLocaleString()}원</b>
        </div>
        <div style="background: #e67e22; color: white; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="opacity:0.8;">💰 이번 주 예상 세수</small><br>
          <b style="font-size:1.4rem;">+ ${expectedWeeklyTax.toLocaleString()}원</b>
        </div>
        <div style="background: #27ae60; color: white; padding: 15px; border-radius: 12px; text-align: center;">
          <small style="opacity:0.8;">💸 시중 유통 통화량</small><br>
          <b style="font-size:1.4rem;">${totalStudentBalance.toLocaleString()}원</b>
        </div>
      </div>

      ${currentUser.isAdmin ? renderAdminSection() : renderStudentSection()}

      <div style="overflow-x: auto; margin-top:30px;">
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #dee2e6;">
          <tr style="background: #f8f9fa;">
            <th style="padding:12px;">부서</th><th>이름</th><th>직업</th><th>주급</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
            <th>현재잔고</th>
          </tr>
          ${db.globalStudents.map((s: any) => {
            const checks = activity.checks[s.name] || [false, false, false, false, false];
            return `
              <tr style="text-align: center; border-bottom: 1px solid #eee;">
                <td style="padding:12px;">${s.dept}</td>
                <td>${s.name}</td>
                <td>${s.role}</td>
                <td>${s.pay.toLocaleString()}</td>
                ${DAYS.map((_, dIdx) => `
                  <td><button onclick="window.toggleCheck('${s.name}', ${dIdx})" ${(!currentUser.isAdmin || isPaid) ? 'disabled' : ''} 
                    style="border-radius:50%; border:none; background:${checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; width:28px; height:28px; cursor:pointer; opacity:${isPaid ? 0.6 : 1};">
                    ${checks[dIdx] ? 'O' : 'X'}</button></td>
                `).join('')}
                <td style="font-weight:bold; color:#1c7ed6;">${s.balance.toLocaleString()}원</td>
              </tr>`;
          }).join('')}
        </table>
      </div>
    </div>
  `;
  setupEvents();
}

function renderLogin() {
  app.innerHTML = `<div style="padding:100px; text-align:center;"><h1>${APP_TITLE}</h1><input id="l-id" placeholder="이름"><br><br><input id="l-pw" type="password" placeholder="비밀번호"><br><br><button id="l-btn">로그인</button></div>`;
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
      <div style="background:white; padding:15px; border-radius:8px;">
        <p style="margin:0 0 10px 0;"><b>🛒 상점 및 벌금 (돈 회수)</b></p>
        <select id="withdraw-s-idx" style="width:100%; padding:5px; margin-bottom:5px;">
          <option value="">학생 선택</option>
          ${db.globalStudents.map((s:any, i:number) => `<option value="${i}">${s.name} (잔고: ${s.balance}원)</option>`).join('')}
        </select>
        <div style="display:flex; gap:5px;">
          <input id="withdraw-amt" type="number" placeholder="금액" style="width:60%;">
          <button id="withdraw-btn" style="background:#fa5252; color:white; border:none; flex:1; cursor:pointer;">회수</button>
        </div>
      </div>
      <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
        <p style="margin:0 0 10px 0;"><b>🛠️ 주간 관리</b></p>
        ${activity.isPaid 
          ? `<button disabled style="background:#adb5bd; color:white; border:none; padding:10px; border-radius:5px; width:100%;">✅ 이번 주 정산 완료</button>`
          : `<button id="pay-btn" style="background:#228be6; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; width:100%;">💰 이번 주 월급 지급하기</button>`
        }
        <div style="display:flex; justify-content:space-between; margin-top:10px;">
           <button id="export-btn" style="font-size:0.7rem;">백업</button>
           <label style="font-size:0.7rem; cursor:pointer;">복구<input type="file" id="import-btn" style="display:none;"></label>
           <button id="logout-btn" style="font-size:0.7rem;">로그아웃</button>
        </div>
      </div>
      <div style="grid-column: span 2; background:white; padding:10px; border-radius:8px; font-size:0.8rem;">
        <b>명단 추가:</b> 
        부서<input id="d" style="width:60px;"> 직업<input id="r" style="width:60px;"> 주급<input id="p" type="number" style="width:60px;"> <button id="add-r-btn">직업추가</button> |
        이름<input id="s-n" style="width:60px;"> <select id="r-s">${db.globalRoles.map((r:any, i:number) => `<option value="${i}">${r.role}</option>`).join('')}</select> <button id="add-s-btn">학생등록</button>
      </div>
    </div>`;
}

function renderStudentSection() {
  const my = db.globalStudents.find((x:any)=>x.name===currentUser.name);
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#e7f5ff; padding:20px; border-radius:12px; border:2px solid #339af0;">
      <div><h2 style="margin:0;">내 잔고: ${my?.balance.toLocaleString()}원</h2><small>${my?.role} (${my?.dept})</small></div>
      <button id="logout-btn">로그아웃</button>
    </div>`;
}

// --- 주차 이동 로직 ---
(window as any).changeWeek = (val: number) => {
  let [y, m, w] = currentView.split('-');
  let year = parseInt(y);
  let month = parseInt(m);
  let week = parseInt(w.replace('W',''));

  week += val;

  if (week > 5) { week = 1; month++; }
  else if (week < 1) { week = 5; month--; }

  if (month > 12) { month = 3; year++; } // 1~2월 방학 가정, 3월부터 시작
  else if (month < 3) { month = 12; year--; }

  currentView = `${year}-${String(month).padStart(2, '0')}-W${week}`;
  localStorage.setItem('econ_v13_view', currentView);
  render();
};

(window as any).toggleCheck = (name: string, dIdx: number) => {
  const activity = getWeeklyActivity(currentView);
  if (activity.isPaid) return; // 정산 완료된 주차는 수정 불가
  if (!activity.checks[name]) activity.checks[name] = [false, false, false, false, false];
  activity.checks[name][dIdx] = !activity.checks[name][dIdx];
  saveData(); render();
};

function setupEvents() {
  document.querySelectorAll('#logout-btn').forEach(b => b.addEventListener('click', () => { currentUser = null; render(); }));
  
  document.querySelector('#withdraw-btn')?.addEventListener('click', () => {
    const sIdx = (document.querySelector('#withdraw-s-idx') as HTMLSelectElement).value;
    const amt = parseInt((document.querySelector('#withdraw-amt') as HTMLInputElement).value);
    if (sIdx !== "" && amt > 0) {
      const s = db.globalStudents[parseInt(sIdx)];
      if (s.balance >= amt) { s.balance -= amt; db.totalWithdrawn += amt; saveData(); render(); }
      else { alert('잔고 부족!'); }
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
    if (confirm(`${currentView.split('-')[1]}월 ${currentView.split('-')[2].replace('W','')}주차 정산을 완료하시겠습니까?`)) {
      db.globalStudents.forEach((s: any) => {
        const checks = activity.checks[s.name] || [false,false,false,false,false];
        const count = checks.filter((v: any) => v).length;
        const daily = s.pay / 5;
        s.balance += Math.floor(daily * 0.9 * count);
        db.treasury.totalTax += Math.floor(daily * 0.1 * count);
      });
      activity.isPaid = true; // 해당 주차 정산 완료 마크
      saveData(); render();
    }
  });

  document.querySelector('#export-btn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `경제교실_백업_v13.json`;
    a.click();
  });

  document.querySelector('#import-btn')?.addEventListener('change', (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => { db = JSON.parse(ev.target.result); saveData(); location.reload(); };
    reader.readAsText(file);
  });
}

function saveData() {
  localStorage.setItem('econ_v13_db', JSON.stringify(db));
}
render();