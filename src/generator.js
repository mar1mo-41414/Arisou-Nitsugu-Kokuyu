export function randomGenerator(seedValue) {
  let state = seedValue >>> 0;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}
export function settingLabel(n) { return n === 0 ? 'なし' : n < 30 ? 'ひかえめ' : n < 65 ? 'ほどほど' : 'つよめ'; }
export function textChars(value) { return Array.from(value.replace(/\r/g, '')); }

// Convert standard hiragana and iteration marks, preserving all other text.
export function toKatakana(text) {
  return text.replace(/[\u3041-\u3096\u309d\u309e][\u3099\u309a]?/g, match =>
    (String.fromCharCode(match.charCodeAt(0) + 0x60) + match.slice(1)).normalize('NFC'));
}

// The default reflects the user's local clock at the time of saving.
export function downloadFilename(value, now = new Date()) {
  const pad = number => String(number).padStart(2, '0');
  const fallback = `告諭_${String(now.getFullYear()).padStart(4, '0')}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const name = value.trim() ? value : fallback;
  return /\.png$/i.test(name) ? name : `${name}.png`;
}

// Canvas does not provide vertical typesetting. Draw each glyph separately so the
// print can drift naturally, with punctuation positioned as in Japanese tategaki.
export function verticalText(context, text, x, y, size, step, random, shift, weight = 700) {
  let cursor = y;
  const chars = textChars(text);
  for (const char of chars) {
    if (char === '\n') continue;
    // Keep moderate settings subtle, while the maximum is visibly irregular.
    const strong = shift ** 3;
    const dx = (random() - .5) * size * (.09 * shift + .29 * strong);
    const dy = (random() - .5) * size * (.055 * shift + .245 * strong);
    const angle = (random() - .5) * (.045 * shift + .24 * strong);
    context.save();
    context.translate(x + dx, cursor + dy);
    context.rotate(angle);
    context.font = `${weight} ${size}px "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    if (/^[、。，．]$/.test(char)) {
      context.fillText(char, size * .26, -size * .25);
    } else if (/^[「『（(]$/.test(char)) {
      context.rotate(Math.PI / 2); context.fillText(char, 0, 0);
    } else if (/^[」』）)]$/.test(char)) {
      context.rotate(Math.PI / 2); context.fillText(char, 0, 0);
    } else if (/^[A-Za-z0-9!?！？ー—―…]$/.test(char)) {
      context.rotate(Math.PI / 2); context.fillText(char, 0, 0);
    } else {
      context.fillText(char, 0, 0);
    }
    context.restore();
    cursor += step;
  }
}
export function bodyLayout(text) {
  const paragraphs = text.replace(/\r/g, '').split('\n').map(textChars);
  // Shrink until every paragraph and wrapped column fits the available area.
  for (let size = 65; size >= 1; size--) {
    const step = size * 1.16;
    const rows = Math.max(1, Math.floor(1380 / step));
    const columns = paragraphs.reduce((sum, p) => sum + Math.max(1, Math.ceil(p.length / rows)), 0);
    if (columns * size * 1.3 <= 650) return {paragraphs, size, step, rows, columns};
  }
  const size = 1, step = size * 1.16, rows = Math.floor(1380 / step);
  return {paragraphs, size, step, rows, columns: paragraphs.reduce((s, p) => s + Math.max(1, Math.ceil(p.length / rows)), 0)};
}

// A mixture of mottling, small grains, and short fibres remains visible even
// when the full-resolution sheet is scaled down for the preview.
export function drawPaper(context, width, height, paper, random) {
  const palettes = {
    white: ['#fffefa', '#aaa397'],
    ivory: ['#f3eedf', '#a99a80'],
    aged: ['#e6dac0', '#968364'],
  };
  const [base, grain] = palettes[paper];
  context.save();
  context.globalAlpha = 1;
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);
  context.fillStyle = grain;
  const intensity = paper === 'white' ? .75 : paper === 'ivory' ? .9 : 1;
  // Broad low-contrast marks make the paper less uniformly flat.
  for (let i = 0; i < 16000; i++) {
    context.globalAlpha = (.025 + random() * .075) * intensity;
    context.fillRect(random() * width, random() * height, 3 + random() * 13, 2 + random() * 10);
  }
  // Darker grains and elongated fibres give the surface its rough texture.
  for (let i = 0; i < 22000; i++) {
    context.globalAlpha = (.08 + random() * .28) * intensity;
    context.fillRect(random() * width, random() * height, .6 + random() * 4, .5 + random() * 3);
  }
  for (let i = 0; i < 4000; i++) {
    context.globalAlpha = (.08 + random() * .22) * intensity;
    const horizontal = random() < .5;
    const length = 3 + random() * 15, thickness = .5 + random() * 1.7;
    context.fillRect(random() * width, random() * height, horizontal ? length : thickness, horizontal ? thickness : length);
  }
  context.restore();
}

// Scratches erase ink only, not the textured sheet beneath it. The cubic term
// makes the upper end much more distressed without overwhelming the defaults.
export function wearInk(context, width, height, wear, random) {
  if (wear <= 0) return;
  const strong = wear ** 3;
  const flecks = Math.floor(25000 * wear + 60000 * strong);
  context.save();
  context.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < flecks; i++) {
    context.globalAlpha = .2 + random() * .8;
    const x = random() * width, y = random() * height;
    context.fillRect(x, y, .7 + random() * (2 + wear * 4 + strong * 3), .5 + random() * (1 + wear * 2 + strong * 1.5));
  }
  context.restore();
}
