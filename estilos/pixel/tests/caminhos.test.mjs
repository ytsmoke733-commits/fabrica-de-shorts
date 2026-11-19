import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posicaoNoFluxo, raioDaOnda, fracoesDoCaminho, pontosSerpentina } from '../kit/mundo/caminhos.mjs';

const perto = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('posicaoNoFluxo: espaçamento uniforme em t = 0', () => {
  const n = 8;
  const us = Array.from({ length: n }, (_, i) => posicaoNoFluxo(i, n, 0, 0.5, true));
  us.forEach((u, i) => assert.ok(perto(u, i / n), `u[${i}] = ${u}`));
  // o espaçamento se mantém com o tempo (caminho fechado: diferença módulo 1)
  const t = 1.37, a = posicaoNoFluxo(2, n, t, 0.5, true), b = posicaoNoFluxo(3, n, t, 0.5, true);
  assert.ok(perto(((b - a) % 1 + 1) % 1, 1 / n));
});

test('posicaoNoFluxo: avança com t e fica sempre em [0, 1) no caminho fechado', () => {
  assert.ok(perto(posicaoNoFluxo(0, 4, 0.5, 0.2, true), 0.1));
  for (let k = 0; k < 50; k++) {
    const u = posicaoNoFluxo(k % 5, 5, k * 0.731, 0.9, true);
    assert.ok(u >= 0 && u < 1, `u = ${u}`);
  }
  // vel negativa anda para trás e também fica em [0, 1)
  const u = posicaoNoFluxo(0, 4, 1, -0.3, true);
  assert.ok(perto(u, 0.7) && u >= 0 && u < 1);
});

test('posicaoNoFluxo: periódico no caminho fechado (período 1 / vel)', () => {
  const vel = 0.4, T = 1 / vel;
  for (const t of [0, 0.3, 2.2, 7.9]) {
    assert.ok(perto(posicaoNoFluxo(3, 7, t, vel, true), posicaoNoFluxo(3, 7, t + T, vel, true), 1e-9));
    assert.ok(perto(posicaoNoFluxo(3, 7, t, vel, true), posicaoNoFluxo(3, 7, t + 3 * T, vel, true), 1e-9));
  }
});

test('posicaoNoFluxo: no caminho aberto a partícula sai de cena no fim (null) e não volta', () => {
  const n = 4, vel = 0.5;
  assert.ok(perto(posicaoNoFluxo(0, n, 0, vel, false), 0));
  assert.ok(perto(posicaoNoFluxo(1, n, 1, vel, false), 0.75));
  assert.equal(posicaoNoFluxo(3, n, 1, vel, false), null);   // 0,75 + 0,5 = 1,25 > 1
  assert.equal(posicaoNoFluxo(0, n, 2.5, vel, false), null);
  assert.equal(posicaoNoFluxo(0, n, 10, vel, false), null);  // não volta como no fechado
  assert.equal(posicaoNoFluxo(0, n, -1, vel, false), null);  // antes da entrada também não aparece
});

test('raioDaOnda: periódico, raio de 0 ao alcance, alfa caindo com o raio', () => {
  const n = 4, vel = 0.5, alcance = 6;
  const a = raioDaOnda(1, n, 0.8, vel, alcance), b = raioDaOnda(1, n, 0.8 + 1 / vel, vel, alcance);
  assert.ok(perto(a.r, b.r, 1e-9) && perto(a.alfa, b.alfa, 1e-9));
  assert.ok(perto(raioDaOnda(0, n, 0, vel, alcance).r, 0));
  assert.ok(perto(raioDaOnda(0, n, 0, vel, alcance).alfa, 1));
  assert.ok(perto(raioDaOnda(1, n, 0, vel, alcance).r, alcance / n));      // ondas espaçadas igualmente
  let ant = Infinity, rAnt = -1;
  for (let k = 0; k < 20; k++) {
    const { r, alfa } = raioDaOnda(0, n, (k / 20) / vel, vel, alcance);
    assert.ok(r > rAnt && r >= 0 && r < alcance, `r = ${r}`);
    assert.ok(alfa < ant && alfa >= 0 && alfa <= 1, `alfa = ${alfa}`);
    ant = alfa; rAnt = r;
  }
});

test('raioDaOnda: alfa 0 no alcance', () => {
  const vel = 0.5, alcance = 6;
  const quase = raioDaOnda(0, 3, (1 - 1e-7) / vel, vel, alcance);
  assert.ok(perto(quase.r, alcance, 1e-5));
  assert.ok(quase.alfa < 1e-5, `alfa = ${quase.alfa}`);
  assert.ok(raioDaOnda(0, 3, -0.4, vel, alcance).r >= 0);                  // t negativo continua válido
});

test('fracoesDoCaminho: u de cada ponto pelo comprimento acumulado (aberto)', () => {
  // 0 -> 1 -> 3 em x: trechos de 1 e 2, total 3
  const us = fracoesDoCaminho([[0, 0, 0], [1, 0, 0], [3, 0, 0]], false);
  assert.equal(us.length, 3);
  assert.ok(perto(us[0], 0) && perto(us[1], 1 / 3) && perto(us[2], 1));
});

test('fracoesDoCaminho: caminho fechado conta o trecho de volta (último ponto < 1)', () => {
  // quadrado de lado 1: perímetro 4, pontos em 0, 1/4, 2/4, 3/4
  const us = fracoesDoCaminho([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], true);
  [0, 0.25, 0.5, 0.75].forEach((e, i) => assert.ok(perto(us[i], e), `u[${i}] = ${us[i]}`));
  // aceita objetos { x, y, z } (Vector3) e é crescente
  const vs = fracoesDoCaminho([{ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, { x: 0, y: 2, z: 2 }], true);
  assert.ok(vs[0] === 0 && vs[1] > 0 && vs[2] > vs[1] && vs[2] < 1);
});

test('fracoesDoCaminho: pontos repetidos não quebram (trecho zero) e caminho degenerado dá zeros', () => {
  const us = fracoesDoCaminho([[0, 0, 0], [0, 0, 0], [2, 0, 0]], false);
  assert.ok(perto(us[0], 0) && perto(us[1], 0) && perto(us[2], 1));
  assert.deepEqual(fracoesDoCaminho([[1, 1, 1], [1, 1, 1]], false), [0, 0]);
});

test('pontosSerpentina: n trechos alternando entre x0 e x1, de y0 a y1, com um ponto em cada volta', () => {
  const pts = pontosSerpentina(1, -1, 4, 2, 3, 0.5);
  assert.equal(pts.length, 3 * 2 + 2);                       // 2 pontos por trecho + 1 por volta
  assert.ok(pts.every((p) => p.length === 3 && p[2] === 0.5));
  assert.deepEqual(pts[0], [1, 4, 0.5]);                     // começa em x0, y0
  assert.ok(perto(pts[3][0], -1) && perto(pts[3][1], 3));    // 2º trecho começa em x1, no meio da altura
  const ult = pts[pts.length - 1];
  assert.ok(perto(ult[1], 2) && ult[0] < 0);                 // termina em y1, do lado de x1 (n ímpar)
  // a volta fica fora da faixa [x1, x0] (curva arredondada para fora) e na altura do meio entre os trechos
  assert.ok(pts[2][0] < -1 && perto(pts[2][1], 3.5));
  // trechos em y decrescente quando y1 < y0; um trecho só = só os 2 pontos
  assert.equal(pontosSerpentina(0, 1, 0, 0, 1, 0).length, 2);
});
