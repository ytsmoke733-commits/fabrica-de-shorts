import { test } from 'node:test';
import assert from 'node:assert/strict';
import { travelling, closeBaixo, drone, orbita, tempoLento, CAMERA_LENTA } from '../kit/cameras.mjs';

const perto = (a, b, eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < eps);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('travelling vai de "de" a "para" e olha do olharDe ao olharPara', () => {
  const o = { de: [0, 1, 5], para: [2, 1, 3], olharDe: [0, 1, 0], olharPara: [1, 1, 0] };
  assert.ok(perto(travelling(o, 0).pos, [0, 1, 5])); assert.ok(perto(travelling(o, 1).pos, [2, 1, 3]));
  assert.ok(perto(travelling(o, 0.5).look, [0.5, 1, 0]));
});

test('closeBaixo fica abaixo do alvo e se aproxima com k', () => {
  const alvo = [0, 1.5, 3.2];
  const a = closeBaixo({ alvo }, 0), b = closeBaixo({ alvo }, 1);
  assert.ok(a.pos[1] < alvo[1]);
  assert.ok(dist(b.pos, alvo) < dist(a.pos, alvo));
  assert.ok(perto(a.look, [0, 1.55, 3.2]));
});

test('drone fica alto e olha para o centro', () => {
  const c = drone({ centro: [0, 0, 20] }, 0);
  assert.ok(c.pos[1] > 30); assert.ok(perto(c.look, [0, 0, 20]));
});

test('órbita mantém o raio e gira de "de" até "ate"', () => {
  const o = { alvo: [0, 1, 0], raio: 3, de: 0, ate: Math.PI / 2, altura: 0 };
  assert.ok(perto(orbita(o, 0).pos, [0, 1, 3])); assert.ok(perto(orbita(o, 1).pos, [3, 1, 0], 1e-9));
});

test('câmera lenta escala o tempo local', () => {
  assert.equal(CAMERA_LENTA, 0.32); assert.equal(tempoLento(2), 0.64); assert.equal(tempoLento(2, 0.5), 1);
});
