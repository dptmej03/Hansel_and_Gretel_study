const GAP = 700; // 쿠키 사이 세로 간격(px)
const key = location.origin + location.pathname;
const day = (d = new Date()) => d.toLocaleDateString('sv'); // YYYY-MM-DD

const layer = document.createElement('div');
layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:0;z-index:2147483647;pointer-events:none;';
document.documentElement.appendChild(layer);

let active = false, eaten = new Set(), owned = [], placed = 0, timer;

async function award(idx, pts) {
  const s = await chrome.storage.local.get({ total: 0, wallet: null, days: {}, streak: 0, lastDay: '', pages: {} });
  if (s.wallet === null) s.wallet = s.total; // 기존에 모은 쿠키를 지갑으로 처음 한 번만 옮김
  const list = s.pages[key] || (s.pages[key] = []);
  if (!list.includes(idx)) list.push(idx);
  const today = day();
  if (s.lastDay !== today) {
    s.streak = s.lastDay === day(new Date(Date.now() - 864e5)) ? s.streak + 1 : 1;
    s.lastDay = today;
  }
  s.total += pts; // 누적 점수: 줄어들지 않음
  s.wallet += pts; // 지갑: 나중에 상점에서 쓰면 줄어듦
  s.days[today] = (s.days[today] || 0) + pts;
  await chrome.storage.local.set(s);
}

function eat(img, idx, pts) {
  eaten.add(idx);
  award(idx, pts);
  img.src = COIN_URL; // 동전으로 바뀌고 잠시 보인 뒤 위로 날아가 사라짐
  img.style.pointerEvents = 'none';
  img.style.transform = 'scale(1.5)';
  setTimeout(() => {
    img.style.transition = 'transform .5s, opacity .5s';
    img.style.transform = 'translateY(-40px) scale(1.5)';
    img.style.opacity = '0';
  }, 400);
  setTimeout(() => img.remove(), 1000);
}

const root = document.documentElement;
let scroller = root;

// 페이지 전체가 스크롤되면 그것, 아니면 가장 긴 안쪽 스크롤 영역(SPA 사이트용)
function findScroller() {
  if (root.scrollHeight > innerHeight + 50) return root;
  let best = root, h = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.scrollHeight > el.clientHeight + 50 && el.clientHeight > 200 && el.scrollHeight > h
        && /auto|scroll/.test(getComputedStyle(el).overflowY)) { best = el; h = el.scrollHeight; }
  }
  return best;
}

function place() {
  const sc = findScroller();
  if (sc !== scroller) { // 스크롤 영역이 바뀌면 쿠키 층을 그쪽으로 옮기고 다시 뿌린다
    scroller = sc;
    if (sc !== root && getComputedStyle(sc).position === 'static') sc.style.position = 'relative';
    sc.appendChild(layer);
    layer.replaceChildren();
    placed = 0;
  }
  // 문서 높이가 늘어나면(더 보기/무한 스크롤) 새 구간에도 쿠키를 뿌린다
  const need = Math.floor(sc.scrollHeight / GAP);
  for (; placed < need; placed++) {
    const idx = placed;
    if (eaten.has(idx)) continue;
    const c = document.createElement('img');
    const snack = pickSnack(idx, owned);
    c.src = snack.url;
    c.dataset.crumb = '';
    const left = 8 + ((idx * 37) % 80); // 가로 위치는 번호로 정해서 새로고침해도 같다
    c.style.cssText = `position:absolute;top:${(idx + 1) * GAP}px;left:${left}%;width:40px;height:40px;object-fit:contain;cursor:pointer;pointer-events:auto;image-rendering:pixelated;`;
    c.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); eat(c, idx, snack.pts); });
    layer.appendChild(c);
  }
}

async function setActive(on) {
  active = on;
  clearInterval(timer);
  layer.replaceChildren();
  placed = 0;
  if (!on) return;
  const s = await chrome.storage.local.get({ pages: {}, owned: [] });
  eaten = new Set(s.pages[key] || []);
  owned = s.owned;
  place();
  timer = setInterval(place, 1500);
}

chrome.storage.local.get({ active: false }).then(s => setActive(s.active));
chrome.storage.onChanged.addListener(c => {
  if (c.active && c.active.newValue !== active) setActive(c.active.newValue);
  else if (c.owned && active) setActive(true); // 간식을 새로 사면 쿠키 자리를 다시 뿌린다
});
