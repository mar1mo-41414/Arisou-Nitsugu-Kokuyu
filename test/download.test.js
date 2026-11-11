import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { downloadFilename, toKatakana } from '../src/generator.js';

test('保存ボタンは編集欄の名前または日時のデフォルトで PNG をダウンロードする', async () => {
  const source = (await readFile(new URL('../src/main.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '');
  const elements = {};
  for (const id of ['title', 'body', 'date', 'issuer', 'wear', 'shift', 'wearValue', 'shiftValue', 'shuffle', 'shuffleTop', 'download', 'filename', 'convertKana']) {
    elements[id] = { value: '', events: {}, addEventListener(type, handler) { this.events[type] = handler; } };
  }
  elements.wear.value = elements.shift.value = '0';
  const context = { clearRect() {}, drawImage() {} };
  elements.canvas = { width: 1200, height: 1650, getContext: () => context, toDataURL: () => 'data:image/png;base64,abc' };
  const downloads = [];
  const drawnText = [];
  const document = {
    getElementById: id => elements[id],
    querySelector: () => ({ value: 'white' }),
    querySelectorAll: () => [],
    fonts: { load: async () => {} },
    createElement: tag => tag === 'canvas' ? { getContext: () => context } : {
      click() { downloads.push({ filename: this.download, url: this.href }); },
    },
  };
  runInNewContext(source, {
    document, downloadFilename, toKatakana,
    randomGenerator: () => () => .5,
    textChars: value => Array.from(value),
    settingLabel: () => 'なし',
    verticalText(_context, text) { drawnText.push(text); }, drawPaper() {}, wearInk() {},
    bodyLayout: text => ({ paragraphs: text.split('\n').map(value => Array.from(value)), columns: 2, size: 65, step: 75, rows: 18 }),
  });
  elements.title.value = 'みなさまへ';
  elements.body.value = 'あした\n晴れ';
  elements.date.value = 'じゅうにち';
  elements.issuer.value = 'ちもと';
  elements.filename.value = 'ひらがな';
  await elements.convertKana.events.click();
  assert.equal(elements.title.value, 'ミナサマヘ');
  assert.equal(elements.body.value, 'アシタ\n晴レ');
  assert.equal(elements.date.value, 'ジュウニチ');
  assert.equal(elements.issuer.value, 'チモト');
  assert.equal(elements.filename.value, 'ひらがな');
  assert.deepEqual(drawnText.slice(-5), ['ミナサマヘ', 'アシタ', '晴レ', 'ジュウニチ', 'チモト']);
  elements.filename.value = '地元ノ告諭';
  await elements.download.events.click();
  assert.deepEqual(downloads[0], { filename: '地元ノ告諭.png', url: 'data:image/png;base64,abc' });
  elements.filename.value = '';
  const before = downloadFilename('');
  await elements.download.events.click();
  const after = downloadFilename('');
  assert.ok([before, after].includes(downloads[1].filename));
  assert.equal(downloads[1].url, 'data:image/png;base64,abc');
});
