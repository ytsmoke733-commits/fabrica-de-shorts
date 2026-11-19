import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parDoEncontro, parAtivo, heroiDaFase, corDoFoton, FASE_ENCONTRO } from '../kit/mundo/led.mjs';

const perto = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const O = { periodo: 2.4, yN: -2, yP: 1.5, yTopo: 5 };

test('parDoEncontro: elétron sobe da camada N e lacuna desce da P até a junção (y = 0)', () => {
  assert.equal(FASE_ENCONTRO, 0.5);
  const n = 8;
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < 10; t += 0.031) {
      const p = parDoEncontro(i, n, t, O);
      assert.equal(JSON.stringify(parDoEncontro(i, n, t, O)), JSON.stringify(p));   // puro
      assert.ok(p.fase >= 0 && p.fase < 1);
      assert.ok(p.x > 0 && p.x < 1);
      if (p.fase < FASE_ENCONTRO) {
        assert.ok(p.eletron.vis && p.lacuna.vis && !p.foton.vis, `i ${i} t ${t}`);
        assert.ok(p.eletron.y >= O.yN - 1e-9 && p.eletron.y <= 1e-9);
        assert.ok(p.lacuna.y <= O.yP + 1e-9 && p.lacuna.y >= -1e-9);
      } else {
        assert.ok(!p.eletron.vis && !p.lacuna.vis && p.foton.vis, `i ${i} t ${t}`);
        assert.ok(p.foton.y >= -1e-9 && p.foton.y <= O.yTopo + 1e-9);
      }
    }
  }
});

test('parDoEncontro: no começo do ciclo estão nas camadas, se encontram na junção e o fóton sobe', () => {
  const n = 8, i = 3, T = O.periodo, t0 = (1 - i / n) * T;   // fase 0 do par i
  const a = parDoEncontro(i, n, t0 + 1e-6, O);
  assert.ok(perto(a.eletron.y, O.yN, 1e-4) && perto(a.lacuna.y, O.yP, 1e-4));
  const m = parDoEncontro(i, n, t0 + FASE_ENCONTRO * T - 1e-6, O);
  assert.ok(Math.abs(m.eletron.y) < 1e-3 && Math.abs(m.lacuna.y) < 1e-3);
  const f0 = parDoEncontro(i, n, t0 + FASE_ENCONTRO * T + 1e-6, O);
  assert.ok(f0.foton.vis && f0.foton.y < 0.01 && f0.flash > 0.99);
  // o fóton só sobe, e o clarão do encontro apaga
  let ant = -1;
  for (let f = FASE_ENCONTRO + 0.01; f < 1; f += 0.02) {
    const p = parDoEncontro(i, n, t0 + f * T, O);
    assert.ok(p.foton.y > ant); ant = p.foton.y;
  }
  assert.equal(parDoEncontro(i, n, t0 + 0.8 * T, O).flash, 0);
  // elétron e lacuna se aproximam sem voltar
  let e0 = -Infinity, l0 = Infinity;
  for (let f = 0.01; f < FASE_ENCONTRO; f += 0.02) {
    const p = parDoEncontro(i, n, t0 + f * T, O);
    assert.ok(p.eletron.y >= e0 && p.lacuna.y <= l0); e0 = p.eletron.y; l0 = p.lacuna.y;
  }
});

test('parDoEncontro: com k = 0 não há corrente (parados nas camadas, sem fóton)', () => {
  for (let i = 0; i < 8; i++) for (let t = 0; t < 5; t += 0.17) {
    const p = parDoEncontro(i, 8, t, { ...O, k: 0 });
    assert.ok(p.eletron.vis && p.lacuna.vis && !p.foton.vis);
    assert.equal(p.eletron.y, O.yN); assert.equal(p.lacuna.y, O.yP);
    assert.equal(p.flash, 0);
  }
});

test('parAtivo: k escolhe quantos pares conduzem (0 nenhum, 1 todos, cresce sem tirar ninguém)', () => {
  const n = 8;
  for (let i = 0; i < n; i++) { assert.equal(parAtivo(i, n, 0), false); assert.equal(parAtivo(i, n, 1), true); }
  let ant = 0;
  for (let k = 0; k <= 1.0001; k += 0.05) {
    const ativos = Array.from({ length: n }, (_, i) => parAtivo(i, n, k));
    const c = ativos.filter(Boolean).length;
    assert.ok(c >= ant); ant = c;
    if (k > 0.01) for (let i = 0; i < n; i++) if (parAtivo(i, n, k - 0.05)) assert.ok(ativos[i]);
  }
  assert.equal(Array.from({ length: n }, (_, i) => parAtivo(i, n, 0.5)).filter(Boolean).length, 4);
});

test('heroiDaFase: escolhe um par que fica na fase pedida a janela inteira (troca só na virada)', () => {
  const n = 8, T = 2.4, J = 0.9;
  for (const [f0, f1] of [[FASE_ENCONTRO, 1], [0, FASE_ENCONTRO]]) {
    for (let t = 0; t < 12; t += 0.05) {
      const h = heroiDaFase(t, n, T, J, f0, f1);
      assert.ok(h >= 0 && h < n, `t ${t}`);
      const ini = Math.floor(t / J) * J;
      assert.equal(heroiDaFase(ini + 0.0001, n, T, J, f0, f1), h);
      for (let s = ini; s < ini + J; s += 0.05) {
        const f = parDoEncontro(h, n, s, { periodo: T }).fase;
        assert.ok(f >= f0 - 1e-9 && f < f1, `t ${t} s ${s}: fase ${f}`);
      }
    }
  }
  // só considera pares ativos; nenhum ativo -> -1
  assert.equal(heroiDaFase(1, n, T, J, FASE_ENCONTRO, 1, 0), -1);
  for (let t = 0; t < 6; t += 0.3) { const h = heroiDaFase(t, n, T, J, FASE_ENCONTRO, 1, 0.5); assert.ok(h === -1 || parAtivo(h, n, 0.5)); }
});

test('corDoFoton: azul (0) até o fósforo, branco (1) depois dele, sem salto', () => {
  assert.equal(corDoFoton(-1, 2, 3), 0);
  assert.equal(corDoFoton(2, 2, 3), 0);
  assert.equal(corDoFoton(3, 2, 3), 1);
  assert.equal(corDoFoton(9, 2, 3), 1);
  assert.ok(perto(corDoFoton(2.5, 2, 3), 0.5));
  let ant = 0;
  for (let y = 1.5; y < 3.5; y += 0.01) { const c = corDoFoton(y, 2, 3); assert.ok(c >= ant && c - ant < 0.05); ant = c; }
});
