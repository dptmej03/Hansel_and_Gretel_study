// 14x14 픽셀 쿠키. o=외곽선 a=밝은 면 b=중간 c=그림자 k=초코칩
const COOKIE_GRID = [
  '....oooooo....',
  '..ooaaaaaabboo',
  '.oaaakaaaaabbo',
  '.oaakkaaakaabo',
  'oaaaakaaaaabbo',
  'oaakaaaaakaabo',
  'oaaaaaakaaabbo',
  'oaaakaaaaaabbo',
  'oaaaaaaakaabco',
  'oaakaaaaaabbco',
  '.obaaakaabbcco',
  '.obbaaaabbccco',
  '..oobbbbbcccoo',
  '....oooooo....'
];
const COOKIE_COLORS = { o: '#3b2314', a: '#f2b84b', b: '#e19a31', c: '#c27a22', k: '#5a3318' };
const pixelUrl = (grid, colors) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid[0].length} ${grid.length}" shape-rendering="crispEdges">` +
  grid.map((row, y) => [...row].map((ch, x) =>
    colors[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>` : ''
  ).join('')).join('') + '</svg>'
);
const COOKIE_URL = pixelUrl(COOKIE_GRID, COOKIE_COLORS);

// 12x12 픽셀 동전. o=외곽선 a=금색 b=어두운 금색 h=하이라이트
const COIN_URL = pixelUrl([
  '...oooooo...',
  '..ohhaaaao..',
  '.ohhaaaaaao.',
  'ohhaaabbaaao',
  'ohaaabaaaabo',
  'ohaaabaaaabo',
  'ohaaabaaaabo',
  'ohaaabbbaabo',
  '.oaaaaaaabo.',
  '.oaaaaaabbo.',
  '..obbbbbbo..',
  '...oooooo...'
], { o: '#6b4a00', a: '#ffd93b', b: '#d99a00', h: '#fff3a0' });

// 간식: 비율은 0~1 사이 난수의 구간(band)으로 정한다. 케이크 10%, 사탕 20%, 초콜릿 33%, 나머지는 쿠키.
// 산 간식(owned)만 나오고, 구간이 겹치지 않아서 안 산 간식 자리는 쿠키가 된다.
const SNACKS = [
  { id: 'cake', name: '케이크', price: 80, pts: 5, band: [0, 0.10], url: pixelUrl([
    '.....cc.....',
    '.....cc.....',
    '..oooooooo..',
    '.owwwwwwwwo.',
    '.owwwwwwwwo.',
    '.oppppppppo.',
    '.oyyyyyyyyo.',
    '.oyyyyyyyyo.',
    '.oppppppppo.',
    '.oyyyyyyyyo.',
    '.oooooooooo.'
  ], { o: '#5a2a1a', w: '#fff7e6', p: '#ff7aa8', y: '#f6d27a', c: '#d6203a' }) },
  { id: 'candy', name: '사탕', price: 30, pts: 3, band: [0.10, 0.30], url: pixelUrl([
    'o..oooooo..o',
    'oo.orwrwo.oo',
    'ooorwrwrwooo',
    'ooowrwrwrooo',
    'oo.owrwro.oo',
    'o..oooooo..o'
  ], { o: '#7a1f3d', r: '#ff5c8a', w: '#ffe3ec' }) },
  { id: 'choco', name: '초콜릿', price: 10, pts: 2, band: [0.30, 0.63], url: pixelUrl([
    'oooooooooo',
    'ohhohhohho',
    'obdobdobdo',
    'oooooooooo',
    'ohhohhohho',
    'obdobdobdo',
    'oooooooooo'
  ], { o: '#2b1608', h: '#8a5530', b: '#6b3a1e', d: '#4a2610' }) }
];
const BASIC = { id: 'cookie', pts: 1, url: COOKIE_URL };

// 번호(idx)마다 항상 같은 간식이 나오게 해서 새로고침해도 자리가 바뀌지 않는다
function pickSnack(idx, owned) {
  const r = (((idx + 1) * 2654435761) % 1000) / 1000;
  return SNACKS.find(s => owned.includes(s.id) && r >= s.band[0] && r < s.band[1]) || BASIC;
}
