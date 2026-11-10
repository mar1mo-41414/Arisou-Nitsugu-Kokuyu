import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyLayout, randomGenerator, settingLabel, textChars, verticalText } from '../src/generator.js';

test('本文の改行ごとに段落ができ、空行も一列として残る', () => {
  const layout = bodyLayout('一、告グ\n\n二、告グ');
  assert.deepEqual(layout.paragraphs.map(p => p.join('')), ['一、告グ', '', '二、告グ']);
  assert.equal(layout.columns, 3);
});

test('長い本文は折り返され、文字を落とさず紙面に収まる', () => {
  const text = '告'.repeat(600);
  const layout = bodyLayout(text);
  assert.equal(layout.paragraphs.flat().join(''), text);
  assert.equal(layout.columns, Math.ceil(600 / layout.rows));
  assert.ok(layout.columns * layout.size * 1.3 <= 650);
  assert.ok(layout.rows * layout.step <= 1380);
});

test('空入力や補助平面の文字も扱える', () => {
  assert.equal(bodyLayout('').columns, 1);
  assert.deepEqual(textChars('𠮷\r野'), ['𠮷', '野']);
});

test('同じ種なら同じ乱数、異なる種なら異なる乱数', () => {
  const a = randomGenerator(42), b = randomGenerator(42), c = randomGenerator(43);
  assert.equal(a(), b());
  assert.notEqual(a(), c());
});

test('かすれ・ゆらぎの表示はゼロだけ「なし」', () => {
  assert.equal(settingLabel(0), 'なし');
  assert.equal(settingLabel(1), 'ひかえめ');
  assert.equal(settingLabel(38), 'ほどほど');
  assert.equal(settingLabel(100), 'つよめ');
});

test('縦書きは文字ごとに描画し、英数字と長音を回転する', () => {
  const calls = [];
  const context = {
    save() {}, restore() {}, translate(x, y) { calls.push(['translate', x, y]); },
    rotate(angle) { calls.push(['rotate', angle]); },
    fillText(char, x, y) { calls.push(['text', char, x, y]); },
  };
  verticalText(context, '告A、ー', 100, 20, 10, 12, () => 0.5, 0);
  assert.deepEqual(calls.filter(c => c[0] === 'text').map(c => c[1]), ['告', 'A', '、', 'ー']);
  assert.deepEqual(calls.filter(c => c[0] === 'translate').map(c => c[2]), [20, 32, 44, 56]);
  assert.equal(calls.filter(c => c[0] === 'rotate' && c[1] === Math.PI / 2).length, 2);
});
