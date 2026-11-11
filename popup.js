document.getElementById('logo').src = COOKIE_URL;
const $ = id => document.getElementById(id);
const DEFAULTS = { total: 0, wallet: null, days: {}, streak: 0, owned: [], active: false };

const toggle = $('toggle');
const label = on => (toggle.textContent = on ? '⏸ 쿠키 숨기기' : '▶ 시작 (쿠키 뿌리기)');
toggle.onclick = async () => {
  const { active } = await chrome.storage.local.get({ active: false });
  await chrome.storage.local.set({ active: !active });
};

async function buy(item) {
  const s = await chrome.storage.local.get(DEFAULTS);
  const wallet = s.wallet ?? s.total; // 지갑이 아직 없으면 기존 누적에서 시작
  if (s.owned.includes(item.id) || wallet < item.price) return; // 중복 구매와 잔액 부족 방어
  await chrome.storage.local.set({ wallet: wallet - item.price, owned: [...s.owned, item.id] });
}

async function render() {
  const s = await chrome.storage.local.get(DEFAULTS);
  const wallet = s.wallet ?? s.total;
  const today = new Date().toLocaleDateString('sv');
  $('wallet').textContent = wallet;
  $('total').textContent = s.total;
  $('today').textContent = s.days[today] || 0;
  $('streak').textContent = s.streak;
  label(s.active);

  const shop = $('shop');
  shop.replaceChildren();
  // 가격이 싼 순서(초콜릿 -> 사탕 -> 케이크)로 보여줌
  for (const item of [...SNACKS].reverse()) {
    const has = s.owned.includes(item.id);
    const row = document.createElement('div');
    row.className = 'item';
    const img = new Image();
    img.src = item.url;
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `${item.name}<small>먹으면 +${item.pts}점</small>`;
    const btn = document.createElement('button');
    btn.textContent = has ? '보유중' : `${item.price}개`;
    btn.disabled = has || wallet < item.price;
    btn.onclick = () => buy(item);
    row.append(img, info, btn);
    shop.append(row);
  }
}

render();
chrome.storage.onChanged.addListener(render); // 구매, 시작 버튼, 다른 탭에서 먹은 쿠키가 바로 반영됨
