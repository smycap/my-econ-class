import './style.css'

const ROLES: { [key: string]: number } = { "기본": 1000, "반장": 1500, "청소": 1200, "급식": 1300, "은행원": 1400 };

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: auto;">
    <h1 style="text-align: center;">🏫 우리 반 경제 교실 은행</h1>
    <div id="admin-panel" style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <input id="student-name" placeholder="학생 이름" style="padding: 8px;" />
      <select id="student-role" style="padding: 8px;">
        ${Object.keys(ROLES).map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <button id="add-btn" style="padding: 8px 15px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer;">학생 추가</button>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button id="pay-btn" style="flex: 1; padding: 15px; background: #2196f3; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">💰 주급 지급 (10% 세금 제외)</button>
      <button id="int-btn" style="flex: 1; padding: 15px; background: #ff9800; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">📈 이자 5% 지급</button>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead><tr style="background: #eee;"><th style="padding: 10px; border: 1px solid #ddd;">이름</th><th style="padding: 10px; border: 1px solid #ddd;">직업</th><th style="padding: 10px; border: 1px solid #ddd;">잔액</th></tr></thead>
      <tbody id="student-list"></tbody>
    </table>
  </div>
`

let students: any[] = JSON.parse(localStorage.getItem('econ_v2') || '[]');

function render() {
  const list = document.querySelector('#student-list')!;
  list.innerHTML = students.map(s => `
    <tr style="text-align: center;">
      <td style="padding: 10px; border: 1px solid #ddd;">${s.name}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${s.role}</td>
      <td style="padding: 10px; border: 1px solid #ddd;"><b>${s.balance.toLocaleString()}원</b></td>
    </tr>
  `).join('');
  localStorage.setItem('econ_v2', JSON.stringify(students));
}

document.querySelector('#add-btn')?.addEventListener('click', () => {
  const nameInput = document.querySelector('#student-name') as HTMLInputElement;
  const roleSelect = document.querySelector('#student-role') as HTMLSelectElement;
  if (!nameInput.value) return;
  students.push({ name: nameInput.value, role: roleSelect.value, balance: 0 });
  nameInput.value = '';
  render();
});

document.querySelector('#pay-btn')?.addEventListener('click', () => {
  students = students.map(s => ({ ...s, balance: s.balance + Math.round(ROLES[s.role] * 0.9) }));
  render();
  alert('주급이 지급되었습니다!');
});

document.querySelector('#int-btn')?.addEventListener('click', () => {
  students = students.map(s => ({ ...s, balance: Math.round(s.balance * 1.05) }));
  render();
  alert('이자가 지급되었습니다!');
});

render();
