import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyLayout, randomGenerator, settingLabel, textChars, verticalText, drawPaper, wearInk, downloadFilename, toKatakana, formatJapaneseDate } from '../src/generator.js';

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

test('ゆらぎはゼロで整列し、最大ではより大きく移動・回転する', () => {
  function sample(shift) {
    const translations = [], rotations = [];
    const context = {
      save() {}, restore() {}, translate(x, y) { translations.push([x, y]); },
      rotate(angle) { rotations.push(angle); }, fillText() {},
    };
    verticalText(context, '告', 100, 100, 100, 100, () => 1, shift);
    return { translations, rotations };
  }
  const zero = sample(0), middle = sample(.38), max = sample(1);
  assert.deepEqual(zero.translations[0], [100, 100]);
  assert.equal(zero.rotations[0], 0);
  assert.ok(max.translations[0][0] - 100 > 3 * (middle.translations[0][0] - 100));
  assert.ok(max.rotations[0] > 3 * middle.rotations[0]);
});

test('紙は全色で背景に加えて粒や繊維を描画し、状態を復元する', () => {
  for (const paper of ['white', 'ivory', 'aged']) {
    let count = 0, saved = 0, restored = 0;
    const context = { save() { saved++; }, restore() { restored++; }, fillRect() { count++; } };
    drawPaper(context, 1200, 1650, paper, randomGenerator(1));
    assert.equal(count, 42001);
    assert.equal(saved, 1);
    assert.equal(restored, 1);
  }
});

test('かすれはゼロで描画せず、最大では中程度より大幅に多く削る', () => {
  function countFlecks(wear) {
    let count = 0, mode;
    const context = { save() {}, restore() {}, fillRect() { count++; mode = this.globalCompositeOperation; } };
    wearInk(context, 1200, 1650, wear, randomGenerator(1));
    return {count, mode};
  }
  assert.equal(countFlecks(0).count, 0);
  const middle = countFlecks(.38), max = countFlecks(1);
  assert.equal(max.mode, 'destination-out');
  assert.ok(max.count > middle.count * 4);
});


test('ファイル名が空欄なら保存時のローカル日時を使う', () => {
  const now = new Date(2026, 0, 2, 3, 4, 59);
  assert.equal(downloadFilename('', now), '告諭_20260102_0304.png');
  assert.equal(downloadFilename(' 　', now), '告諭_20260102_0304.png');
  assert.equal(downloadFilename('', new Date(2027, 11, 31, 23, 59)), '告諭_20271231_2359.png');
});

test('指定ファイル名に PNG 拡張子を重複させない', () => {
  assert.equal(downloadFilename('お知らせ'), 'お知らせ.png');
  assert.equal(downloadFilename('お知らせ.png'), 'お知らせ.png');
  assert.equal(downloadFilename('お知らせ.PNG'), 'お知らせ.PNG');
  assert.equal(downloadFilename('お知らせ.jpg'), 'お知らせ.jpg.png');
  assert.equal(downloadFilename(' 前後に空白 '), ' 前後に空白 .png');
});


test('ひらがなをカタカナに変換し、他の文字や改行を残す', () => {
  assert.equal(toKatakana('みなさまに告ぐ。\nきょうは晴れ！ABC 123'), 'ミナサマニ告グ。\nキョウハ晴レ！ABC 123');
  assert.equal(toKatakana('ぁぃぅぇぉっゃゅょゎゕゖ ゔ ゝゞ'), 'ァィゥェォッャュョヮヵヶ ヴ ヽヾ');
  assert.equal(toKatakana('か\u3099 は\u309a う\u3099'), 'ガ パ ヴ');
  assert.equal(toKatakana('カタカナ 漢字 ゟ 𛀁'), 'カタカナ 漢字 ゟ 𛀁');
  assert.equal(toKatakana(''), '');
});


test('日付はローカルの月日を漢数字にする', () => {
  assert.equal(formatJapaneseDate(new Date(2026, 0, 1)), '一月一日');
  assert.equal(formatJapaneseDate(new Date(2026, 8, 10)), '九月十日');
  assert.equal(formatJapaneseDate(new Date(2026, 9, 11)), '十月十一日');
  assert.equal(formatJapaneseDate(new Date(2026, 10, 20)), '十一月二十日');
  assert.equal(formatJapaneseDate(new Date(2026, 11, 21)), '十二月二十一日');
  assert.equal(formatJapaneseDate(new Date(2026, 11, 31, 23, 59)), '十二月三十一日');
  assert.equal(formatJapaneseDate(new Date(2024, 1, 29)), '二月二十九日');
});
