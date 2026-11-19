import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posicoesNaLinha } from '../kit/linha-do-tempo.mjs';

test('posicoesNaLinha espaça igualmente e alterna o lado', () => {
  const p = posicoesNaLinha(3, { x0: 100, x1: 900, y: 0 });
  assert.deepEqual(p.map((q) => q.x), [100, 500, 900]);
  assert.deepEqual(p.map((q) => q.lado), [-1, 1, -1]);
  assert.ok(p.every((q) => q.y === 0));
});
test('com n = 1 o ponto fica no centro', () => {
  assert.equal(posicoesNaLinha(1, { x0: 100, x1: 900, y: 5 })[0].x, 500);
  assert.deepEqual(posicoesNaLinha(0, { x0: 0, x1: 1, y: 0 }), []);
});
