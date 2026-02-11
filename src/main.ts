import './style.css'

let allData: any = JSON.parse(localStorage.getItem('econ_v9_all_months') || '{}');
let currentMonth: string = localStorage.getItem('econ_v9_view_month') || new Date().toISOString().slice(0, 7);
let treasury: any = JSON.parse(localStorage.getItem('econ_v9_treasury') || '{"totalTax":0}');
let currentUser: any = null;

const app = document.querySelector<HTMLDivElement>('#app')!;

function render() {
  if (!currentUser) {
    app.innerHTML = `
      <div style="padding:50px; text-align:center;">
        <h1>🏛️ 민영쌤의 경제교실</h1>
        <input id="l-id" placeholder="이름" style="padding:10px;"><br><br>
        <input id="l-pw" type="password" placeholder="비밀번호" style="padding:10px;"><br><br>
        <button id="l-btn">로그인</button>
        <p style="margin-top:50px; color:#ccc;">made by smyteacher</p>
      </div>`;
    document.querySelector('#l-btn')?.addEventListener('click', () => {
      const id = (document.querySelector('#l-id') as HTMLInputElement).value;
      const pw = (document.querySelector('#l-pw') as HTMLInputElement).value;
      if (id === 'admin' && pw === '1234') { currentUser = { name: '선생님', isAdmin: true }; render(); }
      else { alert('정보를 확인해주세요!'); }
    });
    return;
  }
  
  const mData = allData[currentMonth] || { students: [], roles: [] };
  app.innerHTML = `
    <div style="padding:20px; max-width:1000px; margin:auto;">
      <div style="text-align:center; background:#f8f9fa; padding:10px; border-radius:10px;">
        <h2>${currentMonth}월 - 🏛️ 민영쌤의 경제교실</h2>
      </div>
      <div style="margin:20px 0; text-align:right;">
        <strong>국고: ${treasury.totalTax}원</strong> | <b>${currentUser.name}님</b> 
        <button id="out-btn">로그아웃</button>
      </div>
      <div style="background:#fff9db; padding:20px; border-radius:10px;">
        <h3>관리자 도구</h3>
        <p>기능들이 정상 작동하려면 먼저 직업과 학생을 등록해주세요.</p>
      </div>
      <p style="text-align:center; margin-top:50px; color:#ccc;">made by smyteacher</p>
    </div>`;
  document.querySelector('#out-btn')?.addEventListener('click', () => { currentUser = null; render(); });
}
render();