import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { intestinoPorDentro } = await import('../kit/corpo/intestino.js');
const { bolinha } = await import('../kit/objetos.js');

const G = intestinoPorDentro(null);
const parede = (X) => X.scene.children.find((c) => c.isMesh && !c.isInstancedMesh && c.material.side === THREE.BackSide);
/** raio médio do anel da parede mais perto de s (distância dos vértices ao ponto da curva) */
const raioEm = (X, s) => {
  const p = parede(X).geometry.attributes.position, NS = 56, NR = 420, i = Math.round(s / X.LEN * NR), c = X.curve.getPointAt(i / NR);
  let soma = 0; for (let j = 0; j < NS; j++) { const k = i * (NS + 1) + j; soma += c.distanceTo(new THREE.Vector3(p.getX(k), p.getY(k), p.getZ(k))); }
  return soma / NS;
};
const snap = (X) => JSON.stringify([Array.from(parede(X).geometry.attributes.position.array), X.scene.children.filter((c) => c.isInstancedMesh).map((m) => Array.from(m.instanceMatrix.array)),
  X.objeto && [X.objeto.visible, X.objeto.position.toArray(), X.objeto.rotation.toArray()], parede(X).material.color.toArray()]);

test('intestinoPorDentro: túnel na curva do v2 (15 pontos, ~42 m), objeto padrão = bolinha clara, sem bolo', () => {
  assert.equal(G.curve.points.length, 15);
  assert.ok(G.LEN > 40 && G.LEN < 46, `LEN ${G.LEN}`);
  assert.equal(G.objeto.parent, G.scene); assert.equal(G.objeto.geometry, bolinha().mesh.geometry); assert.equal(G.objeto.scale.x, 0.3);
  assert.equal(G.objeto.material.color.getHexString(), new THREE.Color('#EBC6D2').getHexString());
  assert.equal(G.bolo, null);
  assert.equal(G.scene.children.filter((c) => c.isInstancedMesh)[0].count, 3000, 'vilosidades');
});

test('intestinoPorDentro: objeto próprio ou nenhum (null); bolo de 11 bolinhas opcional', () => {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial());
  const A = intestinoPorDentro(null, { objeto: obj, bolo: true });
  assert.equal(A.objeto, obj); assert.equal(obj.parent, A.scene);
  assert.equal(A.bolo.children.length, 11); assert.equal(A.bolo.parent, A.scene);
  A.update(0, { bloqueio: 10 }); assert.equal(A.bolo.visible, true); assert.ok(A.bolo.position.distanceTo(A.ponto(10)) < 1e-9);
  A.update(0, {}); assert.equal(A.bolo.visible, false);
  const B = intestinoPorDentro(null, { objeto: null });
  assert.equal(B.objeto, null); B.update(0, { s: 5 });
});

test('intestino.update: objeto em ponto(s, -0,28); some com s = null', () => {
  G.update(1, { s: 8 }); assert.equal(G.objeto.visible, true); assert.ok(G.objeto.position.distanceTo(G.ponto(8, -0.28)) < 1e-9);
  G.update(1, {}); assert.equal(G.objeto.visible, false);
});

test('intestino.update: o anel de contração aperta a parede onde está (−42 %)', () => {
  G.update(0, {}); const livre = raioEm(G, 20);
  G.update(0, { anel: 20 }); assert.ok(raioEm(G, 20) < livre * 0.65, `${raioEm(G, 20)} vs ${livre}`);
  assert.ok(Math.abs(raioEm(G, 30) - livre) / livre < 0.15, 'longe do anel não muda');
});

test('intestino.update: vermelho tinge a parede de alarme', () => {
  G.update(0, { vermelho: 0 }); const c0 = parede(G).material.color.clone();
  G.update(0, { vermelho: 1 }); const c1 = parede(G).material.color;
  assert.ok(c1.r / (c1.g + 1e-6) > c0.r / (c0.g + 1e-6));
});

test('intestino.update: função pura de (t, controles)', () => {
  const A = { s: 6, anel: 4.8, bloqueio: 12, vermelho: 0.3, cam: G.ponto(3, 0.2) };
  G.update(2.2, A); const a = snap(G);
  G.update(7, { s: 20, anel: 19, vermelho: 1, cam: G.ponto(17) }); G.update(2.2, A);
  assert.equal(snap(G), a);
});
