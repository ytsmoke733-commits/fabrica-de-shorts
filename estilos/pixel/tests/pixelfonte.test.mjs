import { test } from 'node:test';
import assert from 'node:assert/strict';
import { G, ACENTO, rasterizar, larguraTexto, faltando } from '../kit/pixelfonte.mjs';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ACENTUADAS = 'ÁÀÂÃÉÊÍÓÔÕÚÜÇ';
const PONTUACAO = '.,!?:-°%×[]/+=~✓→<>()\'"@';

test('todo glifo tem 7 linhas da mesma largura, só com "#" e "."', () => {
  for (const [ch, g] of Object.entries(G)) {
    assert.equal(g.length, 7, `"${ch}" tem ${g.length} linhas`);
    for (const row of g) { assert.equal(row.length, g[0].length, `"${ch}": linhas de larguras diferentes`); assert.match(row, /^[#.]+$/, `"${ch}": caractere estranho`); }
  }
});

test('alfabeto, acentos do português, dígitos e pontuação da legenda/HUD existem (nada vira "?")', () => {
  faltando.clear();
  rasterizar(ALFABETO + ACENTUADAS + PONTUACAO);
  assert.deepEqual([...faltando], []);
  for (const ch of ACENTUADAS) assert.ok(ACENTO[ch], `${ch} sem acento definido`);
});

test('minúscula sai igual à maiúscula (a legenda já vem em CAIXA ALTA, mas o HUD pode mandar minúscula)', () => {
  assert.deepEqual(rasterizar('ímãs, ação'), rasterizar('ÍMÃS, AÇÃO'));
});

test('acento fica acima da maiúscula e a cedilha abaixo', () => {
  const ys = (txt) => rasterizar(txt).px.map(([, y]) => y);
  assert.ok(Math.min(...ys('Á')) < 0 && Math.max(...ys('Á')) === 6);
  assert.ok(Math.min(...ys('Ã')) < 0);
  assert.ok(Math.max(...ys('Ç')) > 6 && Math.min(...ys('Ç')) === 0);
  assert.equal(Math.min(...ys('A')), 0);
});

test('largura: 5 por letra larga + 1 de espaço entre letras, 4 por espaço em branco', () => {
  assert.equal(larguraTexto('A', 1), 5);
  assert.equal(larguraTexto('AB', 1), 11);
  assert.equal(larguraTexto('A B', 1), 5 + 1 + 4 + 5);
  assert.equal(larguraTexto('I.', 3), (5 + 1 + 1) * 3);
  assert.equal(larguraTexto('', 6), 0);
});

test('caractere sem glifo é anotado em `faltando` (e desenhado como "?")', () => {
  faltando.clear();
  const r = rasterizar('A€');
  assert.ok(faltando.has('€'));
  assert.deepEqual(r.px.filter(([x]) => x >= 6).map(([x, y]) => [x - 6, y]), rasterizar('?').px);
});

const NOVOS = ';*#$&_ºª…⚡–—';

test('glifos novos existem, com 7 linhas de largura igual', () => {
  for (const ch of NOVOS) {
    assert.ok(G[ch], `"${ch}" sem glifo`);
    assert.equal(G[ch].length, 7, `"${ch}" não tem 7 linhas`);
    for (const row of G[ch]) assert.equal(row.length, G[ch][0].length, `"${ch}": linhas de larguras diferentes`);
  }
  assert.ok(G['–'][0].length > G['-'][0].length && G['—'][0].length > G['–'][0].length, 'travessões devem ser mais largos que "-"');
  faltando.clear();
  rasterizar(NOVOS);
  assert.deepEqual([...faltando], []);
});

test('"A–B" não usa o glifo de "?"', () => {
  const r = rasterizar('A–B');
  assert.deepEqual(r.px.filter(([x]) => x >= 6 && x < 6 + G['–'][0].length).map(([x, y]) => [x - 6, y]),
    G['–'].flatMap((row, y) => [...row].flatMap((c, i) => (c === '#' ? [[i, y]] : []))));
  assert.ok(!faltando.has('–'));
});

test('caractere sem glifo avisa por console.error só na 1ª vez, mesmo com o cache', () => {
  const orig = console.error, chamadas = [];
  console.error = (...a) => chamadas.push(a.join(' '));
  try {
    faltando.clear();
    rasterizar('A😀');
    assert.equal(chamadas.length, 1);
    assert.match(chamadas[0], /fonte pixel: sem glifo para "😀" \(U\+1F600\)/);
    rasterizar('😀');
    rasterizar('A😀');
    assert.equal(chamadas.length, 1);
  } finally { console.error = orig; }
});

const colunas = (txt) => new Set(rasterizar(txt).px.map(([x]) => x));

test('"()" lado a lado: parênteses de 3 colunas, abertos, com coluna vazia entre eles (não fecham um "O")', () => {
  assert.equal(G['('][0].length, 3);
  assert.equal(G[')'][0].length, 3);
  const r = rasterizar('()'), cols = colunas('()');
  assert.equal(r.w, 7);
  assert.ok(!cols.has(3), 'coluna 3 (espaço entre os glifos) deve ficar vazia');
  const set = new Set(r.px.map(([x, y]) => x + ',' + y));
  for (let y = 1; y <= 5; y++) assert.ok(!(set.has('2,' + y) && set.has('4,' + y)), `linha ${y}: os dois parênteses encostam um no outro`);
  assert.deepEqual(G[')'], G['('].map((row) => [...row].reverse().join('')));
});

test('vírgula desce abaixo da linha de base (y >= 7) e é diferente do ponto', () => {
  const v = rasterizar(','), p = rasterizar('.');
  assert.ok(Math.max(...v.px.map(([, y]) => y)) >= 7);
  assert.ok(Math.max(...p.px.map(([, y]) => y)) === 6);
  assert.notDeepEqual(v.px, p.px);
  assert.ok(v.px.some(([, y]) => y === 6), 'tem ponto na linha de base');
});

test('";" usa a mesma vírgula embaixo', () => {
  const emb = (txt) => rasterizar(txt).px.filter(([, y]) => y >= 6).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(emb(';'), emb(','));
  assert.ok(rasterizar(';').px.some(([, y]) => y < 6), '";" tem ponto em cima');
  assert.equal(rasterizar(';').w, rasterizar(',').w);
});
