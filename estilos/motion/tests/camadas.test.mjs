import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pilula, manchete, etiqueta } from '../kit/camadas.mjs';

const HEX = /#[0-9a-fA-F]{3,6}\b/;

test('pílula: ids prefixados, texto, entrada no tempo pedido e sem cor fixa', () => {
  const p = pilula({ id: 'pd', texto: 'Dado · NordPass 2024', tEntrada: 0.3, tSaida: 2 });
  assert.match(p.html, /id="pd"/);
  assert.match(p.html, /Dado · NordPass 2024/);
  assert.match(p.js, /0\.3\)/);
  assert.ok(!HEX.test(p.css));
  assert.ok([...p.html.matchAll(/id="([^"]+)"/g)].every((m) => m[1].startsWith('pd')));
});

test('manchete: uma palavra marcada vira serif com marca-texto', () => {
  const m = manchete({ id: 'mc', texto: 'A *senha mais usada', tEntrada: 0.2 });
  assert.match(m.html, /class="mc-w mc-key"[^>]*>senha</);
  assert.match(m.html, /id="mc-mark"/);
  assert.equal((m.html.match(/class="mc-w/g) || []).length, 4);
  assert.ok(!HEX.test(m.css));
});

test('manchete: palavra com marca-texto (z-index:-1) cria o próprio contexto de empilhamento', () => {
  const m = manchete({ id: 'mc', texto: 'A *senha mais usada', tEntrada: 0.2 });
  assert.match(m.css, /\.mc-w\{[^}]*isolation:isolate/);
});

test('manchete: espaço entre palavras em px do tamanho (em do contêiner seria 16px e o marca-texto cobriria a vizinha)', () => {
  const m = manchete({ id: 'mc', texto: 'A *senha mais usada', tEntrada: 0.2, tamanho: 100 });
  assert.match(m.css, /#mc\{[^}]*gap:0 26px/);
});

test('manchete: zero ou duas palavras marcadas lança', () => {
  assert.throws(() => manchete({ id: 'mc', texto: 'A senha', tEntrada: 0 }), /manchete "A senha": marque exatamente uma palavra com \*/);
  assert.throws(() => manchete({ id: 'mc', texto: 'A *senha *forte', tEntrada: 0 }), /exatamente uma/);
});

test('etiqueta: texto padrão CÂMERA LENTA e some no tSaida', () => {
  const e = etiqueta({ id: 'cl', tEntrada: 1, tSaida: 2.5 });
  assert.match(e.html, /CÂMERA LENTA/);
  assert.match(e.html, /0,25×/);
  assert.match(e.js, /2\.5\)/);
  assert.ok(!HEX.test(e.css));
});

test('etiqueta: não anima letterSpacing (o hyperframes check recusa; só transform/opacity)', () => {
  const e = etiqueta({ id: 'cl', tEntrada: 1, tSaida: 2.5 });
  assert.doesNotMatch(e.js, /letterSpacing/);
});

test('etiqueta: o texto entra por deslocamento x pequeno, sem escala (não vaza da pílula)', () => {
  const e = etiqueta({ id: 'cl', tEntrada: 1, tSaida: 2.5 });
  const linha = e.js.split('\n').find((l) => l.includes("'#cl-t'"));
  assert.ok(linha, 'tween do texto existe');
  assert.match(linha, /x: -14/);
  assert.doesNotMatch(linha, /scale|transformOrigin/);
  assert.match(e.css, /#cl\{[^}]*gap:16px/);
});

for (const modelo of ['modelo', 'modelo-b']) {
  test(`mix.py de ${modelo} conhece o som "lento"`, () => {
    const mix = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', modelo, 'voz', 'tools', 'mix.py'), 'utf8');
    assert.match(mix, /def lento\(/);
    assert.match(mix, /FX = dict\([\s\S]*lento=lento/);
    assert.match(mix, /LEVEL = dict\([\s\S]*lento=-1\d/);
  });
}

test('pílula e etiqueta: tSaida null não gera tween de saída', () => {
  const p = pilula({ id: 'pn', texto: 'Dado', tEntrada: 0.3, tSaida: null });
  const e = etiqueta({ id: 'en', tEntrada: 1, tSaida: null });
  assert.ok(!/opacity: 0, y: -30/.test(p.js));
  assert.ok(!/tl\.to\(/.test(e.js));
});
