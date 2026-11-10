import './style.css';
import { randomGenerator, settingLabel, textChars, verticalText, bodyLayout } from './generator.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const ink = document.createElement('canvas');
ink.width = canvas.width; ink.height = canvas.height;
const inkCtx = ink.getContext('2d');
const W = canvas.width, H = canvas.height;
const inputs = ['title', 'body', 'date', 'issuer', 'wear', 'shift'];
let seed = Math.floor(Math.random() * 1000000);
let renderId = 0;

function draw() {
  const rand = randomGenerator(seed);
  const paper = document.querySelector('input[name="paper"]:checked').value;
  const palettes = {white: ['#fffefa', '#bdb7a9'], ivory: ['#f3eedf', '#b8a98c'], aged: ['#e6dac0', '#a99673']};
  const [base, grain] = palettes[paper];
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  // Very faint fibres and specks are printed into the exported image, too.
  const paperCount = paper === 'white' ? 900 : paper === 'ivory' ? 2500 : 4500;
  ctx.fillStyle = grain;
  for (let i = 0; i < paperCount; i++) {
    ctx.globalAlpha = rand() * (paper === 'white' ? .045 : .10);
    const x = rand() * W, y = rand() * H;
    ctx.fillRect(x, y, rand() * 2 + .3, rand() * 1.5 + .3);
  }
  ctx.globalAlpha = 1;
  inkCtx.clearRect(0, 0, W, H); inkCtx.fillStyle = '#171815';
  const shift = Number($('shift').value) / 100;
  const title = $('title').value;
  const titleLength = Math.max(1, textChars(title).length);
  const titleSize = Math.min(112, 1400 / (titleLength * 1.16));
  verticalText(inkCtx, title, 1085, 165 + titleSize / 2, titleSize, titleSize * 1.16, rand, shift);
  const layout = bodyLayout($('body').value);
  const spacing = Math.min(150, 650 / Math.max(1, layout.columns));
  let column = 0;
  for (const paragraph of layout.paragraphs) {
    const chunks = Math.max(1, Math.ceil(paragraph.length / layout.rows));
    for (let i = 0; i < chunks; i++) {
      const text = paragraph.slice(i * layout.rows, (i + 1) * layout.rows).join('');
      verticalText(inkCtx, text, 920 - column * spacing, 135 + layout.size / 2, layout.size, layout.step, rand, shift);
      column++;
    }
  }
  const date = $('date').value;
  const dateSize = Math.min(60, 600 / (Math.max(1, textChars(date).length) * 1.13));
  verticalText(inkCtx, date, 168, 145 + dateSize / 2, dateSize, dateSize * 1.13, rand, shift);
  const issuer = $('issuer').value;
  const issuerSize = Math.min(76, 750 / (Math.max(1, textChars(issuer).length) * 1.14));
  const issuerHeight = textChars(issuer).length * issuerSize * 1.14;
  verticalText(inkCtx, issuer, 168, Math.max(800, 1540 - issuerHeight) + issuerSize / 2, issuerSize, issuerSize * 1.14, rand, shift);
  // Erase tiny irregular flecks from the ink layer only, preserving the paper.
  const wear = Number($('wear').value) / 100;
  inkCtx.globalCompositeOperation = 'destination-out';
  const flecks = Math.floor(25000 * wear);
  for (let i = 0; i < flecks; i++) {
    inkCtx.globalAlpha = .2 + rand() * .7;
    const x = rand() * W, y = rand() * H;
    inkCtx.fillRect(x, y, .7 + rand() * (2 + wear * 4), .5 + rand() * (1 + wear * 2));
  }
  inkCtx.globalAlpha = 1; inkCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(ink, 0, 0);
  $('wearValue').textContent = settingLabel(Number($('wear').value));
  $('shiftValue').textContent = settingLabel(Number($('shift').value));
}
async function render() {
  const id = ++renderId;
  // The Japanese font is split into unicode subsets; load the exact glyphs before drawing.
  const text = inputs.slice(0, 4).map(id => $(id).value).join('') || '告諭';
  try { await document.fonts.load('700 65px "Noto Serif JP"', text); } catch (_) { /* system Mincho fallback */ }
  if (id === renderId) draw();
}
for (const id of inputs) $(id).addEventListener('input', render);
document.querySelectorAll('input[name="paper"]').forEach(el => el.addEventListener('change', render));
function shuffle() { seed = Math.floor(Math.random() * 0xffffffff); render(); }
$('shuffle').addEventListener('click', shuffle);
$('shuffleTop').addEventListener('click', shuffle);
$('download').addEventListener('click', async () => {
  await render();
  const link = document.createElement('a');
  link.download = '告諭ビラ.png'; link.href = canvas.toDataURL('image/png'); link.click();
});
render();
