import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { noCaminho } = await import('../kit/corpo/caminho.js');
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

test('noCaminho: põe o objeto no ponto u da curva (u preso em 0..1) e devolve o ponto', () => {
  const c = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(1, 0, 0), V3(1, 1, 0)]), o = new THREE.Object3D();
  const p = noCaminho(o, c, 0.5);
  assert.ok(o.position.equals(c.getPointAt(0.5))); assert.ok(p.equals(o.position));
  noCaminho(o, c, -2); assert.ok(o.position.equals(c.getPointAt(0)));
  noCaminho(o, c, 3); assert.ok(o.position.equals(c.getPointAt(1)));
});
