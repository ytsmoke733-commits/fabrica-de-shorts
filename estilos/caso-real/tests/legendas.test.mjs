import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTempo } from '../kit/tempo.mjs';
import { planejarLegendas, LEGENDA } from '../kit/legendas.mjs';

const wordsDe = (txt, linha, t0) => txt.split(' ').map((w, k) => ({ w, line: linha, s: t0 + k * 0.5, e: t0 + k * 0.5 + 0.3 }));
const tempoDe = (...textos) => {
  let t0 = 0.2; const lines = [], words = [];
  textos.forEach((txt, i) => { const ws = wordsDe(txt, i, t0); words.push(...ws); lines.push({ i, text: txt, start: t0, end: ws[ws.length - 1].e }); t0 = ws[ws.length - 1].e + 0.3; });
  return criarTempo({ duration: t0 + 1, lines }, words);
};

test('caps: um bloco por "|", caixa normal, uma palavra destacada, tempo da 1ª palavra − 0,05', () => {
  const t = tempoDe('E se a Terra parasse de girar?');
  const L = planejarLegendas(t, [{ text: 'E se a Terra parasse de girar?', caps: 'E se a *Terra | parasse de *girar?' }]);
  assert.equal(L.length, 2);
  assert.deepEqual(L[0].palavras, [{ txt: 'E', hi: false }, { txt: 'se', hi: false }, { txt: 'a', hi: false }, { txt: 'Terra', hi: true }]);
  assert.equal(L[0].s, 0.15);
  assert.equal(L[0].e, L[1].s);
  assert.equal(L[1].e, t.duracao);
});

test('caps do caso real: 3 blocos em caixa normal, destaque em maio, 2017 e vírus', () => {
  const txt = 'Em maio de dois mil e dezessete, um vírus';
  const L = planejarLegendas(tempoDe(txt), [{ text: txt, caps: 'Em *maio | de *2017, | um *vírus' }]);
  assert.equal(L.length, 3);
  assert.deepEqual(L.map((b) => b.palavras.map((p) => p.txt)), [['Em', 'maio'], ['de', '2017,'], ['um', 'vírus']]);
  assert.deepEqual(L.map((b) => b.palavras.find((p) => p.hi).txt), ['maio', '2017,', 'vírus']);
});

test('caps com algarismo: "*1.670" cobre "mil seiscentos e setenta"', () => {
  const txt = 'a mil seiscentos e setenta quilômetros';
  const L = planejarLegendas(tempoDe(txt), [{ text: txt, caps: 'a *1.670 | *quilômetros' }]);
  assert.deepEqual(L[0].palavras.map((p) => p.txt), ['a', '1.670']);
  assert.equal(L[1].s, 2.65); // 0,2 + 5×0,5 − 0,05, arredondado a ms (r3)
});

test('caps com número por extenso ou valor errado lança', () => {
  const txt = 'umas cem mil vezes';
  assert.throws(() => planejarLegendas(tempoDe(txt), [{ text: txt, caps: 'umas cem *mil | *vezes' }]), /por extenso/);
  assert.throws(() => planejarLegendas(tempoDe(txt), [{ text: txt, caps: 'umas *200 mil | *vezes' }]), /não bate/);
});

test('sem caps: blocos de até 3, número em algarismo e destacado, caixa normal', () => {
  const txt = 'o ar continuaria correndo a cem mil metros';
  const L = planejarLegendas(tempoDe(txt), [{ text: txt }]);
  const todos = L.flatMap((b) => b.palavras.map((p) => p.txt));
  assert.ok(todos.includes('100') && todos.includes('mil') && !todos.includes('cem'));
  for (const b of L) { assert.ok(b.palavras.length <= 3); assert.equal(b.palavras.filter((p) => p.hi).length, 1); }
  const comNumero = L.find((b) => b.palavras.some((p) => p.txt === '100'));
  assert.ok(comNumero.palavras.find((p) => p.txt === '100').hi);
});

test('fim do bloco: pausa longa entre linhas encerra 0,35 s após o fim da linha', () => {
  const lines = [{ i: 0, text: 'olá mundo', start: 0.2, end: 1.0 }, { i: 1, text: 'tchau', start: 3.0, end: 3.5 }];
  const words = [{ w: 'olá', line: 0, s: 0.2, e: 0.5 }, { w: 'mundo', line: 0, s: 0.6, e: 1.0 }, { w: 'tchau', line: 1, s: 3.0, e: 3.5 }];
  const L = planejarLegendas(criarTempo({ duration: 4, lines }, words), [{ text: 'olá mundo', caps: 'olá *mundo' }, { text: 'tchau', caps: '*tchau' }]);
  assert.equal(L[0].e, 1.35);
});

test('legenda do caso-real: y 1560, corpo 86, largura 940', () => {
  assert.deepEqual(LEGENDA, { y: 1560, size: 86, maxW: 940 });
  assert.equal(LEGENDA.y, 1560);
});
