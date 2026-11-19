import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRECHO_INVERNO, trechoDaChave, calorDaChave, dentroDoTrecho, amplitudeDaVibracao, vibracaoDoAtomo, pontoDaGota, pontosEspiral } from '../kit/mundo/chuveiro.mjs';

const perto = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('trechoDaChave: desligado 0, verão a resistência inteira, inverno um trecho menor', () => {
  assert.equal(trechoDaChave(0), 0);
  assert.equal(trechoDaChave(1), 1);
  assert.ok(perto(trechoDaChave(2), TRECHO_INVERNO));
  assert.ok(TRECHO_INVERNO > 0.3 && TRECHO_INVERNO < 0.8);
  // entre verão e inverno o trecho encolhe sem saltos; fora de [0, 2] satura
  assert.ok(perto(trechoDaChave(1.5), (1 + TRECHO_INVERNO) / 2));
  assert.equal(trechoDaChave(-1), 0);
  assert.ok(perto(trechoDaChave(3), TRECHO_INVERNO));
  let ant = 1;
  for (let p = 1; p <= 2.0001; p += 0.05) { const tr = trechoDaChave(p); assert.ok(tr <= ant + 1e-12, `pos ${p}`); ant = tr; }
});

test('calorDaChave: trecho menor = resistência menor = mais corrente e mais calor (normalizado no inverno)', () => {
  assert.equal(calorDaChave(0), 0);
  assert.ok(perto(calorDaChave(2), 1));
  // mesma tensão: P = V²/R e R proporcional ao comprimento -> verão / inverno = TRECHO_INVERNO
  assert.ok(perto(calorDaChave(1), TRECHO_INVERNO));
  // sobe sem saltos de desligado a inverno
  let ant = 0;
  for (let p = 0; p <= 2.0001; p += 0.02) {
    const c = calorDaChave(p);
    assert.ok(c >= ant - 1e-12 && c - ant < 0.05, `pos ${p}: ${ant} -> ${c}`);
    assert.ok(c >= 0 && c <= 1);
    ant = c;
  }
});

test('dentroDoTrecho: 1 dentro do trecho usado, 0 fora, com borda suave', () => {
  assert.equal(dentroDoTrecho(0.2, 0.6), 1);
  assert.equal(dentroDoTrecho(0.7, 0.6), 0);
  assert.equal(dentroDoTrecho(0.6, 0.6), 0);
  const meio = dentroDoTrecho(0.6 - 0.015, 0.6, 0.03);
  assert.ok(meio > 0.2 && meio < 0.8, `meio ${meio}`);
  // resistência inteira: até a ponta; desligado: nada
  assert.equal(dentroDoTrecho(1, 1), 1);
  assert.equal(dentroDoTrecho(0.5, 1), 1);
  for (const u of [0, 0.3, 1]) assert.equal(dentroDoTrecho(u, 0), 0);
  // não cresce com u (o trecho começa no borne de entrada, u = 0)
  let ant = 1;
  for (let u = 0; u <= 1; u += 0.01) { const v = dentroDoTrecho(u, 0.45); assert.ok(v <= ant + 1e-12); ant = v; }
});

test('vibracaoDoAtomo: cada componente fica dentro da amplitude, que cresce com o calor', () => {
  assert.ok(amplitudeDaVibracao(0) > 0, 'frio ainda vibra um pouco');
  assert.ok(amplitudeDaVibracao(1) > 4 * amplitudeDaVibracao(0));
  assert.ok(amplitudeDaVibracao(0.5) > amplitudeDaVibracao(0.2));
  assert.equal(amplitudeDaVibracao(2), amplitudeDaVibracao(1));   // satura
  for (const calor of [0, 0.3, 1]) {
    const A = amplitudeDaVibracao(calor);
    for (let i = 0; i < 12; i++) for (let k = 0; k < 40; k++) {
      const d = vibracaoDoAtomo(i, k * 0.037, calor);
      assert.equal(d.length, 3);
      d.forEach((c) => assert.ok(Math.abs(c) <= A + 1e-12, `átomo ${i}, calor ${calor}: ${c} > ${A}`));
    }
  }
});

test('vibracaoDoAtomo: quente vibra bem mais que frio; pura e com fase própria por átomo', () => {
  const maior = (calor) => { let m = 0; for (let k = 0; k < 200; k++) for (const c of vibracaoDoAtomo(3, k * 0.013, calor)) m = Math.max(m, Math.abs(c)); return m; };
  assert.ok(maior(1) > 3 * maior(0), `${maior(1)} vs ${maior(0)}`);
  assert.deepEqual(vibracaoDoAtomo(5, 1.234, 0.7), vibracaoDoAtomo(5, 1.234, 0.7));
  assert.notDeepEqual(vibracaoDoAtomo(5, 1.234, 0.7), vibracaoDoAtomo(6, 1.234, 0.7));
  // muda com o tempo
  assert.notDeepEqual(vibracaoDoAtomo(5, 1.234, 0.7), vibracaoDoAtomo(5, 1.3, 0.7));
});

test('pontoDaGota: sai de um furo do crivo e cai até a altura dada', () => {
  const n = 40, raio = 0.08, altura = 2;
  for (let i = 0; i < n; i++) for (let k = 0; k < 30; k++) {
    const g = pontoDaGota(i, n, k * 0.071, { raio, altura });
    assert.ok(g.fase >= 0 && g.fase < 1, `fase ${g.fase}`);
    assert.ok(g.y <= 1e-12 && g.y >= -altura - 1e-12, `y ${g.y}`);
    assert.ok(Number.isFinite(g.x) && Number.isFinite(g.z));
  }
  // na saída (fase 0) cada gota está dentro do crivo e em furos diferentes
  const furos = new Set();
  for (let i = 0; i < n; i++) {
    const g = pontoDaGota(i, n, 0, { raio, altura, vel: 1 });
    const g0 = pontoDaGota(i, n, -g.fase, { raio, altura, vel: 1 });   // volta até a saída
    assert.ok(perto(g0.fase, 0, 1e-9) || perto(g0.fase, 1, 1e-9), `fase ${g0.fase}`);
    assert.ok(Math.hypot(g0.x, g0.z) <= raio + 1e-9);
    assert.ok(Math.abs(g0.y) < 1e-9);
    furos.add(`${g0.x.toFixed(5)}:${g0.z.toFixed(5)}`);
  }
  assert.equal(furos.size, n);
});

test('pontoDaGota: cai cada vez mais rápido, abre um pouco e é periódica (período 1 / vel)', () => {
  const o = { raio: 0.08, altura: 2, vel: 1.5, abre: 0.4 };
  const T = 1 / o.vel;
  const a = pontoDaGota(7, 20, 0.1, o), b = pontoDaGota(7, 20, 0.1 + T, o);
  assert.ok(perto(a.x, b.x, 1e-9) && perto(a.y, b.y, 1e-9) && perto(a.z, b.z, 1e-9));
  // dentro de um ciclo: y desce sempre, a distância ao eixo cresce e a queda acelera
  const g0 = pontoDaGota(7, 20, 0, o), t0 = -g0.fase * T;
  const amostra = [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => pontoDaGota(7, 20, t0 + f * T, o));
  for (let k = 1; k < amostra.length; k++) {
    assert.ok(amostra[k].y < amostra[k - 1].y);
    assert.ok(Math.hypot(amostra[k].x, amostra[k].z) > Math.hypot(amostra[k - 1].x, amostra[k - 1].z));
  }
  const queda1 = amostra[0].y - amostra[1].y, queda2 = amostra[3].y - amostra[4].y;
  assert.ok(queda2 > queda1, `${queda1} ${queda2}`);
});

test('pontosEspiral: hélice de raio fixo, do y0 ao y1, porVolta pontos por volta', () => {
  const p = pontosEspiral(5, 0.035, -0.04, -0.11, 12);
  assert.equal(p.length, 5 * 12 + 1);
  p.forEach(([x, , z]) => assert.ok(perto(Math.hypot(x, z), 0.035, 1e-12)));
  assert.ok(perto(p[0][1], -0.04) && perto(p[p.length - 1][1], -0.11));
  for (let k = 1; k < p.length; k++) assert.ok(p[k][1] < p[k - 1][1]);
  // começa e termina no mesmo ângulo (voltas inteiras)
  assert.ok(perto(p[0][0], p[p.length - 1][0], 1e-12) && perto(p[0][2], p[p.length - 1][2], 1e-12));
});
