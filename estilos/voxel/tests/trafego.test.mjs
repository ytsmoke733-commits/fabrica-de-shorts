import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CICLO, estadoSemaforo, RETENCAO, FAIXA, CARRO_MAX, VAGA, mao, MAOS, maxCarros, posicaoCarro, vagaFila, posicaoPedestre } from '../kit/mundo/trafego.mjs';

const PASSO = 0.05, T0 = -3;
/** t de T0 em passos de 0,05 s por dois períodos da mão (cada período = `grupos` ciclos), com folga */
const tempos = (M, DUR = 2 * M.grupos * CICLO + 6) => { const ts = []; for (let t = T0; t <= T0 + DUR; t += PASSO) ts.push(+t.toFixed(4)); return ts; };

test('semáforo: verde 0–7, amarelo 7–8,5, vermelho 8,5–12, repetindo (inclusive com t negativo)', () => {
  const casos = [[0, 'verde'], [6.99, 'verde'], [7, 'amarelo'], [8.49, 'amarelo'], [8.5, 'vermelho'], [11.99, 'vermelho'], [12, 'verde'], [19.2, 'amarelo'], [-1, 'vermelho'], [-12, 'verde']];
  for (const [t, e] of casos) assert.equal(estadoSemaforo(t), e, `t = ${t}`);
});

MAOS.forEach((M, mi) => {
  const N = maxCarros(M);

  test(`[mão ${mi}] nenhum carro dentro da faixa enquanto o semáforo da mão está vermelho`, () => {
    for (const t of tempos(M)) {
      if (estadoSemaforo(t) !== 'vermelho') continue;
      for (let k = 0; k < N; k++) {
        const s = posicaoCarro(t, k, M);
        const dentro = s + CARRO_MAX / 2 > FAIXA[0] && s - CARRO_MAX / 2 < FAIXA[1];
        assert.ok(!dentro, `carro ${k} na faixa em t = ${t} (s = ${s.toFixed(2)})`);
      }
    }
  });

  test(`[mão ${mi}] carros da mesma mão nunca ficam a menos de comprimento + 1 m (distância na volta)`, () => {
    let menor = Infinity;
    for (const t of tempos(M)) {
      const s = Array.from({ length: N }, (_, k) => posicaoCarro(t, k, M)).sort((a, b) => a - b);
      for (let i = 0; i < N; i++) { const d = i < N - 1 ? s[i + 1] - s[i] : s[0] + M.volta - s[i]; menor = Math.min(menor, d); }
    }
    assert.ok(menor > CARRO_MAX + 1, `menor distância ${menor.toFixed(2)} m`);
  });

  test(`[mão ${mi}] no vermelho os carros param na retenção e formam fila (parados, uma vaga atrás da outra)`, () => {
    for (const ciclo of [0, 1, 2, 3]) {
      const t = ciclo * CICLO + 11.5, parados = [];
      for (let k = 0; k < N; k++) { const a = posicaoCarro(t, k, M), b = posicaoCarro(t + 0.4, k, M); if (Math.abs(a - b) < 1e-9 && Math.abs(a) < 40) parados.push(a); }
      parados.sort((x, y) => y - x);
      assert.ok(parados.length >= 2, `fila no ciclo ${ciclo}: ${parados.length} carros`);
      parados.forEach((s, q) => assert.ok(Math.abs(s - vagaFila(q)) < 1e-9, `vaga ${q}: ${s}`));
      assert.ok(parados[0] + CARRO_MAX / 2 <= RETENCAO, 'o primeiro para antes da linha');
      assert.ok(Math.abs(vagaFila(1) - vagaFila(0) + VAGA) < 1e-9);
    }
  });

  test(`[mão ${mi}] no verde a fila anda: o primeiro da fila cruza a faixa`, () => {
    const k0 = 0, t = M.grupos * CICLO;                         // o grupo 0 sai no começo de cada período
    assert.ok(Math.abs(posicaoCarro(t, k0, M) - vagaFila(0)) < 1e-9);
    assert.ok(posicaoCarro(t + 4, k0, M) > FAIXA[1] + CARRO_MAX / 2);
  });

  test(`[mão ${mi}] posição é função pura de t e a volta (wrap) fica longe da faixa (≥ 100 m)`, () => {
    assert.ok(M.volta / 2 >= 100, `meia volta ${M.volta / 2}`);
    for (const t of [0, 3.3, 17.25, 40]) for (let k = 0; k < N; k++) {
      const s = posicaoCarro(t, k, M);
      assert.equal(s, posicaoCarro(t, k, M));
      assert.ok(s >= -M.volta / 2 && s < M.volta / 2);
    }
    assert.throws(() => posicaoCarro(0, N, M), /no máximo/);
  });
});

test('a mão padrão é a primeira das duas', () => assert.deepEqual(mao(), MAOS[0]));

test('pedestre: x0 + v·t dentro da volta, determinístico', () => {
  const p = { x0: 10, v: 1.2 };
  assert.equal(posicaoPedestre(0, p, 200), 10);
  assert.ok(Math.abs(posicaoPedestre(5, p, 200) - 16) < 1e-9);
  assert.ok(Math.abs(posicaoPedestre(80, { x0: 90, v: 1 }, 200) - -30) < 1e-9);   // 170 → volta para −30
  assert.ok(Math.abs(posicaoPedestre(-10, { x0: -95, v: 1 }, 200) - 95) < 1e-9);
});
