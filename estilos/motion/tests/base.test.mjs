import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cena, escreverComposicao, escreverIndex, escreverCues, HELPERS, CSS_COMUM } from '../kit/base.mjs';

const TEMA = { nome: 't', cores: { fundo: '#111', fundo2: '#222', texto: '#fff', apagado: '#999', fraco: '#555', acento: '#f80', perigo: '#f00', alerta: '#fa0', destaque: '#0ff' }, fontes: { sans: 'Inter', serif: 'Georgia', mono: 'JetBrains Mono' } };

test('cena junta as partes', () => {
  const c = cena('x', 2.5, [{ css: '.a{}', html: '<i></i>', js: 'a();' }, { css: '.b{}', html: '<b></b>', js: 'b();' }]);
  assert.equal(c.id, 'x');
  assert.equal(c.d, 2.5);
  assert.ok(c.css.includes('.a{}') && c.css.includes('.b{}'));
  assert.ok(c.js.indexOf('a();') < c.js.indexOf('b();'));
});

test('helpers trazem count, typeText, spring, pop e click', () => {
  for (const f of ['function count', 'function typeText', 'function spring', 'function pop', 'function click']) assert.ok(HELPERS.includes(f), f);
});

test('escreve composição com variáveis do tema, index e cues', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-'));
  const video = path.join(dir, 'video'), voz = path.join(dir, 'voz');
  escreverComposicao(video, cena('cena1', 2, [{ css: '', html: '<div id="k"></div>', js: '' }]), TEMA);
  const comp = fs.readFileSync(path.join(video, 'compositions', 'cena1.html'), 'utf8');
  assert.match(comp, /--acento:#f80;/);
  assert.match(comp, /data-composition-id="cena1"/);
  escreverIndex(video, { titulo: 'T', duracao: 4, cenas: [{ id: 'cena1', a: 0, d: 2, faixa: 1, z: 2, tipo: 'graphics' }], tema: TEMA });
  const idx = fs.readFileSync(path.join(video, 'index.html'), 'utf8');
  assert.match(idx, /gsap@3\.15\.0/);
  assert.match(idx, /data-composition-src="compositions\/cena1\.html"/);
  assert.match(idx, /assets\/mix\.wav/);
  escreverCues(voz, 4, [{ t: 2, type: 'pop' }, { t: 1, type: 'whoosh' }]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(voz, 'data', 'cues.json'), 'utf8')).cues.map((c) => c.t), [1, 2]);
});

test('escalar envolve o html numa escala em torno de "de" e preserva css e js', async () => {
  const { escalar } = await import('../kit/base.mjs');
  const p = escalar({ css: '.a{}', html: '<i id="x"></i>', js: 'x()' }, { escala: 1.25, de: [540, 730], para: [540, 800] });
  assert.equal(p.css, '.a{}');
  assert.equal(p.js, 'x()');
  assert.match(p.html, /transform-origin:540px 730px/);
  assert.match(p.html, /translate\(0px,70px\) scale\(1\.25\)/);
  assert.ok(p.html.includes('<i id="x"></i>'));
  assert.throws(() => escalar({ html: '' }, { escala: 0, de: [1, 1] }), /escala/);
});

test('CSS comum: cartão e barra de janela vêm do tema', () => {
  assert.ok(!CSS_COMUM.includes('#2E3238'));
  assert.ok(!/\.card\{[^}]*rgba\(32,35,41/.test(CSS_COMUM));
  assert.match(CSS_COMUM, /var\(--cartao\)/);
  assert.match(CSS_COMUM, /var\(--janela1\)[\s\S]*var\(--janela2\)[\s\S]*var\(--janela3\)/);
});
