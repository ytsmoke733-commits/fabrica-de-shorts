import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digitacaoNoTempo, ledAceso, piscaLampada, gotaDeChuva, estadoDoLed, trechoDoFio } from '../kit/ritmo.mjs';

test('digitacaoNoTempo fica em ±6 graus e é pura de t', () => {
  for (let t = 0; t < 20; t += 0.07) {
    const d = digitacaoNoTempo(t);
    for (const k of ['elL', 'elR', 'punhoL', 'punhoR']) assert.ok(Math.abs(d[k]) <= 6 + 1e-9, k);
  }
  assert.deepEqual(digitacaoNoTempo(1.3), digitacaoNoTempo(1.3));
});
test('ledAceso é determinístico e cerca de 70% aceso', () => {
  assert.equal(ledAceso(3, 1.2), ledAceso(3, 1.2));
  let on = 0, n = 0;
  for (let i = 0; i < 20; i++) for (let k = 0; k < 20; k++) { n++; if (ledAceso(i, k / 8)) on++; }
  assert.equal(n, 400);
  assert.ok(on / n >= 0.55 && on / n <= 0.85, `${on / n}`);
});
test('piscaLampada fica em [0, 1] e cai em rajadas', () => {
  let min = 1;
  for (let t = 0; t < 60; t += 0.03) { const v = piscaLampada(t); assert.ok(v >= 0 && v <= 1); min = Math.min(min, v); }
  assert.ok(min < 0.9);
  assert.equal(piscaLampada(1.234, 0), 1);
  assert.equal(piscaLampada(5, 1), piscaLampada(5, 1));
  for (let t = 0; t < 60; t += 0.03) assert.ok(piscaLampada(t, 3) >= 0 && piscaLampada(t, -2) === 1);   // força fora de [0, 1] é limitada
});
test('gotaDeChuva é pura e cai dentro da caixa', () => {
  const caixa = { x: 0, y: 0, w: 1080, h: 1920 };
  assert.deepEqual(gotaDeChuva(5, 0.7, caixa), gotaDeChuva(5, 0.7, caixa));
  for (let i = 0; i < 50; i++) for (const t of [0, 0.5, 3.3]) {
    const [x, y] = gotaDeChuva(i, t, caixa);
    assert.ok(x >= -100 && x <= 1180 && y >= 0 && y <= 1920, `${x},${y}`);
  }
  assert.notDeepEqual(gotaDeChuva(5, 0.1, caixa), gotaDeChuva(5, 0.2, caixa));
});
test('gotaDeChuva fica dentro da caixa mesmo com vento e t negativo', () => {
  const caixa = { x: -6, y: 0, w: 12, h: 7 };
  for (let i = 0; i < 300; i++) for (const t of [-2.37, -0.5, 0, 0.41, 7.9]) {
    const [x, y] = gotaDeChuva(i, t, caixa);
    assert.ok(x >= caixa.x && x <= caixa.x + caixa.w, `x ${x} (i ${i}, t ${t})`);
    assert.ok(y >= caixa.y && y <= caixa.y + caixa.h, `y ${y} (i ${i}, t ${t})`);
  }
});
test('estadoDoLed: sem alarme é verde ou apagado como o ledAceso', () => {
  for (let i = 0; i < 60; i++) for (const t of [0, 0.3, 1.7]) assert.equal(estadoDoLed(i, t), ledAceso(i, t) ? 'verde' : 'apagado');
  assert.equal(estadoDoLed(4, 1.1, 0.7), estadoDoLed(4, 1.1, 0.7));
});
test('estadoDoLed: com alarme uma parte vira vermelha e pisca, crescendo com o alarme', () => {
  const vermelhosEm = (alarme) => { const s = new Set(); for (let i = 0; i < 400; i++) for (let k = 0; k < 24; k++) if (estadoDoLed(i, k / 12, alarme) === 'vermelho') s.add(i); return s.size; };
  const meio = vermelhosEm(0.5), cheio = vermelhosEm(1);
  assert.ok(meio > 0 && meio < cheio, `${meio} < ${cheio}`);
  assert.ok(cheio > 400 * 0.25 && cheio < 400 * 0.6, `${cheio}`);
  // o LED do alarme pisca: no mesmo LED, há quadros vermelhos e quadros apagados
  const i = [...Array(400).keys()].find((j) => estadoDoLed(j, 0.05, 1) === 'vermelho');
  const estados = new Set(); for (let k = 0; k < 24; k++) estados.add(estadoDoLed(i, k / 12, 1));
  assert.deepEqual([...estados].sort(), ['apagado', 'vermelho']);
});
test('trechoDoFio revela os fios em ordem, de 0 a 1', () => {
  const n = 5;
  for (let j = 0; j < n; j++) { assert.equal(trechoDoFio(j, n, 0), 0); assert.equal(trechoDoFio(j, n, 1), 1); }
  for (let b = 0; b <= 1; b += 0.01) for (let j = 0; j < n; j++) {
    const k = trechoDoFio(j, n, b);
    assert.ok(k >= 0 && k <= 1);
    if (j > 0 && k > 0) assert.equal(trechoDoFio(j - 1, n, b), 1, `fio ${j} antes do ${j - 1} terminar (b ${b})`);
    assert.ok(trechoDoFio(j, n, Math.min(1, b + 0.01)) >= k);
  }
  assert.equal(trechoDoFio(2, 5, 0.5), 0.5);
  assert.equal(trechoDoFio(0, 5, -1), 0); assert.equal(trechoDoFio(4, 5, 2), 1);
});
