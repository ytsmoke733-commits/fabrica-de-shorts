import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTINENTES, CIDADES, projetar, ehTerra, pontoDoArco } from '../kit/mapa.mjs';

const caixa = { x: 10, y: 20, w: 360, h: 150 };

test('polígonos têm entre 10 e 25 pontos', () => {
  assert.ok(CONTINENTES.length >= 7);
  for (const p of CONTINENTES) assert.ok(p.length >= 10 && p.length <= 25, `${p.length}`);
});
test('ehTerra: cidades e Groenlândia são terra', () => {
  for (const c of ['São Paulo', 'Moscou', 'Sydney', 'Lagos', 'Pequim', 'Nova York']) assert.ok(ehTerra(CIDADES[c]), c);
  assert.ok(ehTerra([-42, 72]));
});
test('ehTerra: oceanos não são terra', () => {
  for (const p of [[-30, 0], [-150, 0], [80, -20], [-40, 40]]) assert.ok(!ehTerra(p), String(p));
});
test('todas as cidades são terra', () => {
  for (const [n, p] of Object.entries(CIDADES)) assert.ok(ehTerra(p), n);
});
test('projetar: cantos da caixa', () => {
  assert.deepEqual(projetar([-180, 90], caixa), [10, 20]);
  assert.deepEqual(projetar([180, -60], caixa), [370, 170]);
});
test('pontoDoArco: extremos e meio acima', () => {
  const a = CIDADES['São Paulo'], b = CIDADES['Londres'];
  const pa = projetar(a, caixa), pb = projetar(b, caixa);
  const p0 = pontoDoArco(a, b, 0, 0.25, caixa), p1 = pontoDoArco(a, b, 1, 0.25, caixa);
  assert.ok(Math.abs(p0[0] - pa[0]) < 1e-9 && Math.abs(p0[1] - pa[1]) < 1e-9);
  assert.ok(Math.abs(p1[0] - pb[0]) < 1e-9 && Math.abs(p1[1] - pb[1]) < 1e-9);
  assert.ok(pontoDoArco(a, b, 0.5, 0.25, caixa)[1] < (pa[1] + pb[1]) / 2);
});
