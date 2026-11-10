export function randomGenerator(seedValue) {
  let state = seedValue >>> 0;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}
export function settingLabel(n) { return n === 0 ? 'なし' : n < 30 ? 'ひかえめ' : n < 65 ? 'ほどほど' : 'つよめ'; }
export function textChars(value) { return Array.from(value.replace(/\r/g, '')); }

// Canvas does not provide vertical typesetting. Draw each glyph separately so the
// print can drift naturally, with punctuation positioned as in Japanese tategaki.
export function verticalText(context, text, x, y, size, step, random, shift, weight = 700) {
  let cursor = y;
  const chars = textChars(text);
  for (const char of chars) {
    if (char === '\n') continue;
    const dx = (random() - .5) * shift * size * .09;
    const dy = (random() - .5) * shift * size * .055;
    const angle = (random() - .5) * shift * .045;
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
