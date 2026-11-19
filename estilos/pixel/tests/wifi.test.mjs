import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ledDoRoteador, N_LEDS, GHZ_MICROONDAS, comprimentoDeOnda, ondaDaPlanta, periodoNaPlanta,
  perdaNaParede, fatorDaParede, forcaDoSinal, barrasDeSinal,
} from '../kit/mundo/wifi.mjs';

const perto = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('ledDoRoteador: 0 ou 1, puro em t; energia sempre acesa', () => {
  assert.equal(N_LEDS, 4);
  for (let t = 0; t < 20; t += 0.0137) {
    for (let i = 0; i < N_LEDS; i++) {
      const v = ledDoRoteador(i, t);
      assert.ok(v === 0 || v === 1, `led ${i} t ${t}: ${v}`);
      assert.equal(ledDoRoteador(i, t), v);
    }
    assert.equal(ledDoRoteador(0, t), 1);
  }
});

test('ledDoRoteador: os LEDs do Wi-Fi piscam (tráfego), sem tremer mais rápido que 12 Hz', () => {
  for (const i of [2, 3]) {
    let acesos = 0, trocas = 0, ant = ledDoRoteador(i, 0);
    const N = 2000;
    for (let s = 0; s < N; s++) {
      const v = ledDoRoteador(i, s * 0.005);
      acesos += v; if (v !== ant) trocas++; ant = v;
    }
    const frac = acesos / N;
    assert.ok(frac > 0.3 && frac < 0.85, `led ${i}: aceso ${frac}`);
    assert.ok(trocas >= 15, `led ${i}: ${trocas} trocas em 10 s`);
    // constante dentro de cada fatia de 1/12 s
    for (let k = 0; k < 120; k++) assert.equal(ledDoRoteador(i, k / 12 + 0.001), ledDoRoteador(i, k / 12 + 0.08), `led ${i} fatia ${k}`);
  }
  // os dois LEDs do Wi-Fi não piscam iguais
  let iguais = 0;
  for (let k = 0; k < 240; k++) if (ledDoRoteador(2, k / 12 + 0.01) === ledDoRoteador(3, k / 12 + 0.01)) iguais++;
  assert.ok(iguais < 200, `iguais ${iguais}/240`);
});

test('ledDoRoteador: internet acesa quase sempre (pisca raro)', () => {
  let acesos = 0;
  for (let s = 0; s < 2000; s++) acesos += ledDoRoteador(1, s * 0.005);
  assert.ok(acesos / 2000 > 0.85, `internet ${acesos / 2000}`);
});

test('comprimentoDeOnda: c / f em metros', () => {
  assert.ok(perto(comprimentoDeOnda(2.4), 0.299792458 / 2.4));
  assert.ok(Math.abs(comprimentoDeOnda(2.4) - 0.125) < 0.001);
  assert.ok(Math.abs(comprimentoDeOnda(5) - 0.06) < 0.001);
  assert.ok(perto(GHZ_MICROONDAS, 2.45));
});

test('ondaDaPlanta: em 2,45 GHz é a senoide antiga da planta; 5 GHz tem onda mais curta, mesma velocidade', () => {
  for (const [x, t] of [[0, 0], [1.3, 0.4], [-4.2, 2.7], [5.9, 1.11]]) {
    assert.ok(perto(ondaDaPlanta(x, t, { ghz: GHZ_MICROONDAS, amp: 0.9, vel: 1 }), Math.sin(x * 1.6 - t * 2 * Math.PI) * 0.9, 1e-12));
  }
  // período espacial proporcional a 1 / ghz
  const l24 = periodoNaPlanta(2.4), l5 = periodoNaPlanta(5);
  assert.ok(perto(l5 / l24, 2.4 / 5, 1e-12));
  for (const ghz of [2.4, 5]) {
    const l = periodoNaPlanta(ghz);
    for (const x of [-3, 0.7, 2.2]) assert.ok(perto(ondaDaPlanta(x + l, 0.3, { ghz }), ondaDaPlanta(x, 0.3, { ghz }), 1e-9));
  }
  // velocidade de fase igual nas duas frequências (a crista anda o mesmo tanto no mesmo tempo)
  const c = (2 * Math.PI * 1) / 1.6, dt = 0.137;
  for (const ghz of [2.4, 5]) assert.ok(perto(ondaDaPlanta(1 + c * dt, 0.5 + dt, { ghz }), ondaDaPlanta(1, 0.5, { ghz }), 1e-9));
  // amp padrão 0,9
  assert.ok(Math.abs(ondaDaPlanta(Math.PI / 2 / 1.6, 0, { ghz: GHZ_MICROONDAS })) - 0.9 < 1e-12);
});

test('perdaNaParede e fatorDaParede: 5 GHz perde mais; dB vira fator de amplitude', () => {
  assert.equal(perdaNaParede(2.4), 6);
  assert.equal(perdaNaParede(5), 10);
  assert.ok(perdaNaParede(5) > perdaNaParede(2.4));
  assert.ok(perto(perdaNaParede(3.7), 8));
  assert.equal(fatorDaParede(0), 1);
  assert.ok(Math.abs(fatorDaParede(6) - 0.501) < 0.001);
  let ant = 1;
  for (let db = 0; db <= 30; db += 1) { const f = fatorDaParede(db); assert.ok(f <= ant && f > 0); ant = f; }
});

test('forcaDoSinal: cai com a distância, com as paredes e é menor em 5 GHz', () => {
  const a = forcaDoSinal(1, { ghz: 2.4 });
  assert.ok(Math.abs(a.dbm - (20 - (20 * Math.log10(2400) - 27.55))) < 1e-9);
  assert.equal(a.forca, 1);
  const b = forcaDoSinal(5, { ghz: 2.4, paredes: 1 });
  assert.ok(Math.abs(b.dbm - (20 - (20 * Math.log10(5) + 20 * Math.log10(2400) - 27.55) - 6)) < 1e-9);
  let ant = Infinity;
  for (let d = 0.5; d < 60; d *= 1.3) { const f = forcaDoSinal(d).dbm; assert.ok(f < ant); ant = f; }
  assert.ok(forcaDoSinal(4, { paredes: 2 }).dbm < forcaDoSinal(4, { paredes: 1 }).dbm);
  assert.ok(forcaDoSinal(4, { ghz: 5, paredes: 1 }).dbm < forcaDoSinal(4, { ghz: 2.4, paredes: 1 }).dbm);
  for (const d of [0.1, 1, 10, 1000]) { const { forca } = forcaDoSinal(d, { paredes: 3 }); assert.ok(forca >= 0 && forca <= 1); }
  assert.equal(forcaDoSinal(5000, { paredes: 4 }).forca, 0);
});

test('barrasDeSinal: 0 a 4 barras pelo dBm', () => {
  assert.equal(barrasDeSinal(-40), 4);
  assert.equal(barrasDeSinal(-55), 4);
  assert.equal(barrasDeSinal(-60), 3);
  assert.equal(barrasDeSinal(-70), 2);
  assert.equal(barrasDeSinal(-80), 1);
  assert.equal(barrasDeSinal(-95), 0);
  let ant = 0;
  for (let dbm = -110; dbm <= -20; dbm += 0.5) { const b = barrasDeSinal(dbm); assert.ok(b >= ant && Number.isInteger(b)); ant = b; }
});
