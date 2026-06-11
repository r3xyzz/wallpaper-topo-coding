const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('wrap');
const dayValue = document.getElementById('day-value');
const dateValue = document.getElementById('date-value');
const monthValue = document.getElementById('month-value');
const yearValue = document.getElementById('year-value');
const hourValue = document.getElementById('hour-value');
const minuteValue = document.getElementById('minute-value');
const secondValue = document.getElementById('second-value');
const progressValue = document.getElementById('progress-value');

let W, H, t = 0;
const LINES = 28;
const SPEED = 0.00018;

function resize() {
  W = canvas.width = wrap.offsetWidth;
  H = canvas.height = wrap.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

function noise(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = p[X] + Y, b = p[X + 1] + Y;
  return lerp(v,
    lerp(u, grad(p[a], x, y, z), grad(p[b], x - 1, y, z)),
    lerp(u, grad(p[a + 1], x, y - 1, z), grad(p[b + 1], x - 1, y - 1, z))
  );
}
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y, z) {
  const h = hash & 15, u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}
const perm = [];
for (let i = 0; i < 256; i++) perm[i] = i;
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [perm[i], perm[j]] = [perm[j], perm[i]];
}
const p = new Array(512);
for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

function getHeight(x, y, time) {
  const s = 0.0025;
  return (
    noise(x * s + time * 0.3, y * s + time * 0.2, time * 0.1) * 0.60 +
    noise(x * s * 2.1 - time * 0.15, y * s * 2.1 + time * 0.25, time * 0.13) * 0.25 +
    noise(x * s * 4.3 + time * 0.08, y * s * 4.3 - time * 0.18, time * 0.07) * 0.15
  );
}

function drawContours() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f3ee';
  ctx.fillRect(0, 0, W, H);

  const GRID = 3;
  const cols = Math.ceil(W / GRID) + 2;
  const rows = Math.ceil(H / GRID) + 2;

  const field = [];
  for (let row = 0; row <= rows; row++) {
    field[row] = [];
    for (let col = 0; col <= cols; col++) {
      field[row][col] = getHeight(col * GRID, row * GRID, t);
    }
  }

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.7;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let li = 0; li < LINES; li++) {
    const level = -0.9 + (li / (LINES - 1)) * 1.8;
    ctx.beginPath();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * GRID, y0 = row * GRID;
        const v00 = field[row][col] - level;
        const v10 = field[row][col + 1] - level;
        const v01 = field[row + 1][col] - level;
        const v11 = field[row + 1][col + 1] - level;

        const idx = (v00 > 0 ? 8 : 0) | (v10 > 0 ? 4 : 0) | (v11 > 0 ? 2 : 0) | (v01 > 0 ? 1 : 0);
        if (idx === 0 || idx === 15) continue;

        function interp(a, b, va, vb) {
          if (Math.abs(va - vb) < 0.00001) return a;
          return a + (b - a) * (-va / (vb - va));
        }

        const pts = {
          N: [interp(x0, x0 + GRID, v00, v10), y0],
          E: [x0 + GRID, interp(y0, y0 + GRID, v10, v11)],
          S: [interp(x0 + GRID, x0, v11, v01), y0 + GRID],
          W: [x0, interp(y0, y0 + GRID, v00, v01)]
        };

        let segs = [];
        switch (idx) {
          case 1: case 14: segs = [[pts.S, pts.W]]; break;
          case 2: case 13: segs = [[pts.E, pts.S]]; break;
          case 3: case 12: segs = [[pts.E, pts.W]]; break;
          case 4: case 11: segs = [[pts.N, pts.E]]; break;
          case 6: case 9: segs = [[pts.N, pts.S]]; break;
          case 7: case 8: segs = [[pts.N, pts.W]]; break;
          case 5: segs = [[pts.N, pts.E], [pts.S, pts.W]]; break;
          case 10: segs = [[pts.N, pts.W], [pts.E, pts.S]]; break;
        }

        for (const seg of segs) {
          ctx.moveTo(seg[0][0], seg[0][1]);
          ctx.lineTo(seg[1][0], seg[1][1]);
        }
      }
    }
    ctx.stroke();
    ctx.beginPath();
  }
}

let last = 0;
function loop(ts) {
  t += SPEED * (ts - last || 16);
  last = ts;
  drawContours();
  requestAnimationFrame(loop);
}

const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const day = days[now.getDay()];
  const date = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const progress = Math.round((minutesSinceMidnight / (24 * 60)) * 100);

  dayValue.textContent = day;
  dateValue.textContent = date;
  monthValue.textContent = month;
  yearValue.textContent = year;
  hourValue.textContent = h;
  minuteValue.textContent = m;
  secondValue.textContent = s;
  progressValue.textContent = String(progress).padStart(2, '0');
}

updateClock();
setInterval(updateClock, 1000);
requestAnimationFrame(loop);