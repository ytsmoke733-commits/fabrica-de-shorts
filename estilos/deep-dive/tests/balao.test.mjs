import { test } from 'node:test'; import assert from 'node:assert/strict';
import { pedacosDoEstouro } from '../kit/balao.mjs';
test('pedacosDoEstouro: 14 pedaços, determinístico, ângulos cobrem a volta', () => {
  const a = pedacosDoEstouro();
  assert.equal(a.length, 14);
  assert.deepEqual(a, pedacosDoEstouro());
  const angs = a.map((p) => p.ang);
  assert.ok(Math.min(...angs) < 1 && Math.max(...angs) > 5);
  assert.ok(a.every((p) => Number.isFinite(p.vel) && Number.isFinite(p.giro)));
});
test('pedacosDoEstouro: seed muda o resultado, n muda a quantidade', () => {
  assert.notDeepEqual(pedacosDoEstouro(14, 1), pedacosDoEstouro(14, 2));
  assert.equal(pedacosDoEstouro(6).length, 6);
});
