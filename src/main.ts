import './style.css'

// 데이터 저장소 (v17 유지)
let db: any = JSON.parse(localStorage.getItem('econ_v17_db') || JSON.stringify({
  globalRoles: [],
  globalStudents: [],
  weeklyActivity: {}, 
  treasury: { totalTax: 0 },
  totalWithdrawn: 0
}));

let currentView: string = localStorage.getItem('econ_v17_view') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-W1`;
let currentUser: any = null;
const DAYS = ['월', '화', '수', '목', '금'];
const APP_TITLE = "🏛️ 민영쌤의 경제교실"; 

const app = document.querySelector<HTMLDivElement>('#app')!;

function getWeeklyActivity(viewKey: string) {
  if (!db.weeklyActivity[viewKey]) {
    db.weeklyActivity[viewKey] = { checks: {}, isPaid: false, dayLocks: [false, false, false, false, false] };
  }
  return db.weeklyActivity[viewKey];
}

function render() {
  if (!currentUser) { renderLogin(); return; }
  const activity = getWeeklyActivity(currentView);
  
  let expectedWeeklyTax = 0;
  let totalStudentBalance = 0;
  db.globalStudents.forEach((s: any) => {
    const checks = activity.checks[s.name] || [false, false, false, false, false];
    const count = checks.filter((v: any) => v).length;
    expectedWeeklyTax += Math.floor((s.pay / 5) * 0.1 * count);
    totalStudentBalance += s.balance;
  });

  app.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 1100px; margin: auto;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; background: #f1f3f5; padding: 15px; border-radius: 12px;">
        <button onclick="window.changeWeek(-1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">◀</button>
        <h2 style="margin:0;">📅 ${currentView.split('-')[1]}월 ${currentView.split('-')[2].replace('W','')}주차 ${activity.isPaid ? '<span style="color:#40c057; font-size:0.9rem;">[정산완료]</span>' : ''}</h2>
        <button onclick="window.changeWeek(1)" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">▶</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; text-align: center;">
        <div style="background: #212529; color: #fcc419; padding: 15px; border-radius: 12px;">🏛️ 누적 국고<br><b>${db.treasury.totalTax.toLocaleString()}원</b></div>
        <div style="background: #e67e22; color: white; padding: 15px; border-radius: 12px;">💰 주간 예상 세수<br><b>+ ${expectedWeeklyTax.toLocaleString()}원</b></div>
        <div style="background: #27ae60; color: white; padding: 15px; border-radius: 12px;">💸 유통 통화량<br><b>${totalStudentBalance.toLocaleString()}원</b></div>
      </div>

      ${currentUser.isAdmin ? renderAdminSection() : renderStudentSection()}

      <div style="overflow-x: auto; margin-top:30px; border-radius: 10px; border: 1px solid #dee2e6;">
        <table style="width: 100%; border-collapse: collapse; background: white; table-layout: fixed;">
          <thead style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <tr>
              <th style="padding:15px; width: 100px;">부서</th>
              <th style="padding:15px; width: 100px;">이름</th>
              <th style="padding:15px; width: 120px;">직업</th>
              ${DAYS.map((d, i) => `
                <th style="padding:10px; width: 80px;">
                  ${d}<br>
                  ${currentUser.isAdmin ? `<button onclick="window.toggleDayLock(${i})" style="font-size:10px; cursor:pointer; background:${activity.dayLocks[i]?'#fa5252':'#adb5bd'}; color:white; border:none; border-radius:3px;">${activity.dayLocks[i]?'잠금해제':'마감하기'}</button>` : ''}
                </th>`).join('')}
              <th style="padding:15px; width: 130px;">현재잔고</th>
            </tr>
          </thead>
          <tbody>
          ${db.globalStudents.map((s: any) => {
            const checks = activity.checks[s.name] || [false, false, false, false, false];
            return `
              <tr style="border-bottom: 1px solid #eee; text-align:center;">
                <td style="padding:12px;">${s.dept}</td>
                <td style="padding:12px;">${s.name}${s.isManager ? '⭐' : ''}</td>
                <td style="padding:12px;">${s.role}</td>
                ${DAYS.map((_, dIdx) => {
                  const isLocked = activity.dayLocks[dIdx] || activity.isPaid;
                  const canEdit = currentUser.isAdmin || (currentUser.isManager && !isLocked);
                  return `
                  <td style="padding:12px;">
                    <div style="display: flex; justify-content: center; align-items: center;">
                      <button onclick="window.toggleCheck('${s.name}', ${dIdx})" ${!canEdit ? 'disabled' : ''} 
                        style="border-radius:50%; border:none; background:${checks[dIdx] ? '#4caf50' : '#ff4757'}; color:white; width:30px; height:30px; cursor:${canEdit?'pointer':'default'}; opacity:${isLocked?0.5:1}; font-weight:bold;">
                        ${checks[dIdx] ? 'O' : 'X'}</button>
                    </div>
                  </td>`;
                }).join('')}
                <td style="padding:12px; font-weight:bold; color:#1c7ed6;">${s.balance.toLocaleString()}원</td>
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
  app.innerHTML = `
    <div style="padding:100px; text-align:center;">
      <h1 style="margin-bottom:30px;">${APP_TITLE}</h1>
      <div style="max-width:300px; margin:auto; background:#f8f9fa; padding:30px; border-radius:15px; border:1px solid #dee2e6;">
        <input id="l-id" placeholder="이름을 입력하세요" style="padding:12px; width:100%; margin-bottom:10px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;"><br>
        <input id="l-pw" type="password" placeholder="비밀번호" style="padding:12px; width:100%; margin-bottom:20px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;"><br>
        <button id="l-btn" style="padding:12px; width:100%; background:#228be6; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:1rem;">로그인</button>
      </div>
      <p style="margin-top:20px; color:#adb5bd; font-size:0.8rem;">관리자 계정은 별도로 로그인해 주세요.</p>
    </div>`;
  
  document.querySelector('#l-btn')?.addEventListener('click', () => {
    // .trim()을 사용하여 앞뒤 공백을 완전히 제거합니다.
    const id = (document.querySelector('#l-id') as HTMLInputElement).value.trim();
    const pw = (document.querySelector('#l-pw') as HTMLInputElement).value.trim();
    
    if (id === 'admin' && pw === '1234') {
      currentUser = { name: '선생님', isAdmin: true };
      render();
    } else {
      // 대소문자나 공백 문제를 방지하기 위해 trim 적용 후 찾기
      const s = db.globalStudents.find((x:any) => x.name.trim() === id);
      if (s && pw === id + "123") {
        currentUser = { ...s, isAdmin: false };
        render();
      } else {
        alert('정보가 일치하지 않습니다. 이름과 비밀번호를 다시 확인해 주세요!');
      }
    }
  });
}

function renderAdminSection() {
  const activity = getWeeklyActivity(currentView);
  return `
    <div style="background: #fff9db; padding: 20px; border-radius: 12px; border: 1px solid #fab005; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background:white; padding:15px; border-radius:8px;">
        <p style="margin:0 0 10px 0;"><b>👤 학생 관리 (수정/삭제/대표)</b></p>
        <select id="edit-s-idx" style="width:100%; padding:8px; margin-bottom:10px;">
          <option value="">수정/삭제할 학생 선택</option>
          ${db.globalStudents.map((s:any, i:number) => `<option value="${i}">${s.name} (${s.role})${s.isManager?' [대표]':''}</option>`).join('')}
        </select>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px; margin-bottom:10px;">
          <input id="edit-dept" placeholder="부서">
          <input id="edit-role" placeholder="직업">
          <input id="edit-pay" type="number" placeholder="주급">
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button id="edit-s-btn" style="flex:1; background:#fd7e14; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">정보수정</button>
          <button id="set-manager-btn" style="flex:1; background:#495057; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">대표지정</button>
          <button id="delete-s-btn" style="flex:1; background:#fa5252; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">삭제</button>
        </div>
      </div>

      <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
        <p style="margin:0 0 10px 0;"><b>🛠️ 주간 정산 및 도구</b></p>
        ${!activity.isPaid 
          ? `<button id="pay-btn" style="background:#228be6; color:white; border:none; padding:12px; border-radius:5px; width:100%; cursor:pointer; font-weight:bold;">💰 이번 주 월급 지급</button>`
          : `<button id="unpay-btn" style="background:#fab005; color:black; border:none; padding:12px; border-radius:5px; width:100%; cursor:pointer; font-weight:bold;">🔄 정산 취소</button>`
        }
        <div style="display:flex; justify-content:center; gap:10px; font-size:0.8rem; margin-top:20px;">
          <button id="export-btn" style="cursor:pointer;">💾 백업</button>
          <label style="cursor:pointer; background:#eee; padding:2px 8px; border-radius:3px;">📂 복구<input type="file" id="import-btn" style="display:none;"></label>
          <button id="logout-btn" style="cursor:pointer; color:red;">로그아웃</button>
        </div>
      </div>

      <div style="grid-column: span 2; background:white; padding:15px; border-radius:8px; border: 1px dashed #fab005; font-size:0.9rem;">
        <b>1. 직업 추가:</b> 부서<input id="d" style="width:60px;"> 직업<input id="r" style="width:80px;"> 주급<input id="p" type="number" style="width:60px;"> <button id="add-r-btn">추가</button> |
        <b>2. 학생 등록:</b> 이름<input id="s-n" style="width:60px;"> <select id="r-s">${db.globalRoles.map((r:any, i:number) => `<option value="${i}">${r.role}</option>`).join('')}</select> <button id="add-s-btn">등록</button>
      </div>
    </div>`;
}

function renderStudentSection() {
  const my = db.globalStudents.find((x:any)=>x.name===currentUser.name);
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#e7f5ff; padding:20px; border-radius:12px; border:2px solid #339af0;">
      <div>
        <h2 style="margin:0;">내 잔고: ${my?.balance.toLocaleString()}원</h2>
        <span style="background:${my?.isManager?'#e67e22':'#339af0'}; color:white; padding:2px 8px; border-radius:10px; font-size:0.8rem;">
          ${my?.isManager ? '⭐ 대표 학생 (업무 체크 권한)' : '일반 학생'}
        </span>
      </div>
      <button id="logout-btn" style="padding:10px 20px; border-radius:5px; border:1px solid #ddd; cursor:pointer;">로그아웃</button>
    </div>`;
}

// 전역 헬퍼 함수들
(window as any).toggleDayLock = (idx: number) => {
  const activity = getWeeklyActivity(currentView);
  activity.dayLocks[idx] = !activity.dayLocks[idx];
  saveData(); render();
};

(window as any).toggleCheck = (name: string, dIdx: number) => {
  const activity = getWeeklyActivity(currentView);
  const isLocked = activity.dayLocks[dIdx] || activity.isPaid;
  const canEdit = currentUser.isAdmin || (currentUser.isManager && !isLocked);
  if (!canEdit) return;
  if (!activity.checks[name]) activity.checks[name] = [false, false, false, false, false];
  activity.checks[name][dIdx] = !activity.checks[name][dIdx];
  saveData(); render();
};

(window as any).changeWeek = (val: number) => {
  let [y, m, w] = currentView.split('-');
  let month = parseInt(m); let week = parseInt(w.replace('W',''));
  week += val;
  if (week > 5) { week = 1; month++; } else if (week < 1) { week = 5; month--; }
  if (month > 12) { month = 3; } else if (month < 3) { month = 12; }
  currentView = `${y}-${String(month).padStart(2, '0')}-W${week}`;
  localStorage.setItem('econ_v17_view', currentView);
  render();
};

function setupEvents() {
  document.querySelectorAll('#logout-btn').forEach(b => b.addEventListener('click', () => { currentUser = null; render(); }));
  document.querySelector('#set-manager-btn')?.addEventListener('click', () => {
    const sIdx = (document.querySelector('#edit-s-idx') as HTMLSelectElement).value;
    if (sIdx !== "") {
      db.globalStudents[parseInt(sIdx)].isManager = !db.globalStudents[parseInt(sIdx)].isManager;
      saveData(); render();
    }
  });
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
  document.querySelector('#delete-s-btn')?.addEventListener('click', () => {
    const sIdx = (document.querySelector('#edit-s-idx') as HTMLSelectElement).value;
    if (sIdx !== "" && confirm('정말 삭제하시겠습니까?')) {
      db.globalStudents.splice(parseInt(sIdx), 1);
      saveData(); render();
    }
  });
  document.querySelector('#add-r-btn')?.addEventListener('click', () => {
    const dept = (document.querySelector('#d') as HTMLInputElement).value;
    const role = (document.querySelector('#r') as HTMLInputElement).value;
    const pay = parseInt((document.querySelector('#p') as HTMLInputElement).value);
    if (dept && role && pay) { db.globalRoles.push({ dept, role, pay }); saveData(); render(); }
  });
  document.querySelector('#add-s-btn')?.addEventListener('click', () => {
    const name = (document.querySelector('#s-n') as HTMLInputElement).value.trim();
    const rIdx = (document.querySelector('#r-s') as HTMLSelectElement).value;
    if (name && rIdx) {
      const r = db.globalRoles[parseInt(rIdx)];
      db.globalStudents.push({ name, role: r.role, dept: r.dept, pay: r.pay, balance: 0, isManager: false });
      saveData(); render();
    }
  });
  document.querySelector('#pay-btn')?.addEventListener('click', () => {
    const activity = getWeeklyActivity(currentView);
    if (confirm('주간 정산을 완료합니까?')) {
      db.globalStudents.forEach((s: any) => {
        const checks = activity.checks[s.name] || [false,false,false,false,false];
        const count = checks.filter((v: any) => v).length;
        s.balance += Math.floor((s.pay / 5) * 0.9 * count);
        db.treasury.totalTax += Math.floor((s.pay / 5) * 0.1 * count);
      });
      activity.isPaid = true; saveData(); render();
    }
  });
  document.querySelector('#unpay-btn')?.addEventListener('click', () => {
    const activity = getWeeklyActivity(currentView);
    if (confirm('정산을 취소합니까?')) {
      db.globalStudents.forEach((s: any) => {
        const checks = activity.checks[s.name] || [false,false,false,false,false];
        const count = checks.filter((v: any) => v).length;
        s.balance -= Math.floor((s.pay / 5) * 0.9 * count);
        db.treasury.totalTax -= Math.floor((s.pay / 5) * 0.1 * count);
      });
      activity.isPaid = false; saveData(); render();
    }
  });
  document.querySelector('#export-btn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `경제교실_백업.json`; a.click();
  });
  document.querySelector('#import-btn')?.addEventListener('change', (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => { db = JSON.parse(ev.target.result); saveData(); location.reload(); };
    reader.readAsText(file);
  });
}

function saveData() {
  localStorage.setItem('econ_v17_db', JSON.stringify(db));
}
render();