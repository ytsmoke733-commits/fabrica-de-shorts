import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { esofago, intestino, ENTRADA_ESTOMAGO } = await import('../kit/corpo/tubos.js');
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const NR = 160, NS = 18, R0 = 0.0108;
/** raio do anel i do esôfago: distância média dos vértices ao centro do anel */
function raioDoAnel(E, i) {
  const p = E.mesh.geometry.attributes.position, c = V3(0, 0, 0), vs = [];
  for (let j = 0; j < NS; j++) { const v = V3(p.getX(i * (NS + 1) + j), p.getY(i * (NS + 1) + j), p.getZ(i * (NS + 1) + j)); vs.push(v); c.add(v); }
  c.divideScalar(NS); return vs.reduce((s, v) => s + v.distanceTo(c), 0) / NS;
}

test('esofago: pontos do v2 (boca → entrada do estômago), U1 0,94, tubo 160 × 18', () => {
  const E = esofago();
  assert.equal(E.curve.points.length, 8);
  assert.ok(E.curve.points[0].equals(V3(0, 0.624, 0.095)));
  assert.ok(E.curve.points[7].equals(ENTRADA_ESTOMAGO)); assert.ok(ENTRADA_ESTOMAGO.equals(V3(0.012, 0.215, 0.04)));
  assert.equal(E.U1, 0.94);
  assert.equal(E.mesh.geometry.attributes.position.count, (NR + 1) * (NS + 1));
  assert.equal(E.mesh.material, E.mat);
});

test('esofago: pontos trocáveis', () => {
  const P = [V3(0, 1, 0), V3(0, 0.5, 0.1), V3(0.1, 0, 0)], E = esofago({ pontos: P });
  assert.equal(E.curve.points.length, 3); assert.ok(E.curve.points[2].equals(P[2]));
  assert.ok(E.curve.points[0] !== P[0], 'copia os pontos');
});

test('esofago.update: sem bolinha (u < 0) o tubo é liso; com bolinha incha nela e aperta logo atrás (onda)', () => {
  const E = esofago();
  E.update(-1, 1, 0);
  for (const i of [0, 40, 80, 120, 160]) assert.ok(Math.abs(raioDoAnel(E, i) / R0 - 1) < 0.06, `anel ${i}`);
  const u = 0.5, i0 = Math.round(u / E.U1 * NR), iAperto = Math.round((u / E.U1 - 0.075) * NR);
  E.update(u, 1, 0);
  assert.ok(raioDoAnel(E, i0) > R0 * 1.2, `incha: ${raioDoAnel(E, i0)}`);
  assert.ok(raioDoAnel(E, iAperto) < R0 * 0.6, `aperta: ${raioDoAnel(E, iAperto)}`);
  E.update(u, 0, 0); assert.ok(Math.abs(raioDoAnel(E, i0) / R0 - 1) < 0.06, 'amt 0 = sem onda');
});

test('esofago.update: função pura de (u, amt, t)', () => {
  const E = esofago(), snap = () => Array.from(E.mesh.geometry.attributes.position.array);
  E.update(0.4, 1, 2.2); const a = snap();
  E.update(0.8, 0.3, 7); E.update(0.4, 1, 2.2);
  assert.deepEqual(snap(), a);
});

test('intestino: serpentina do v2 (29 pontos, da saída do estômago à pelve) com tubo; pontos trocáveis', () => {
  const I = intestino();
  assert.equal(I.curve.points.length, 29);
  assert.ok(I.curve.points[0].equals(V3(0.075, 0.115, 0.045))); assert.ok(I.curve.points[28].equals(V3(0.06, -0.06, 0.03)));
  assert.equal(I.mesh.geometry.type, 'TubeGeometry'); assert.equal(I.mesh.material, I.mat);
  const P = [V3(0, 0, 0), V3(0.1, 0, 0), V3(0.1, -0.1, 0)], J = intestino({ pontos: P });
  assert.equal(J.curve.points.length, 3); assert.ok(J.curve.points[1].equals(P[1]));
});

test('intestino: opacidade (padrão 1 = opaco como no v2; < 1 translúcido sem escrever profundidade)', () => {
  const A = intestino();
  assert.equal(A.mat.opacity, 1); assert.equal(A.mat.transparent, false); assert.equal(A.mat.depthWrite, true);
  const B = intestino({ opacidade: 0.6 });
  assert.equal(B.mat.opacity, 0.6); assert.equal(B.mat.transparent, true); assert.equal(B.mat.depthWrite, false);
});

test('esofago: a lista padrão não compartilha o ENTRADA_ESTOMAGO exportado (mexer nele não muda o esôfago)', () => {
  const x0 = ENTRADA_ESTOMAGO.x;
  try { ENTRADA_ESTOMAGO.x += 1; assert.ok(esofago().curve.points[7].equals(V3(0.012, 0.215, 0.04))); }
  finally { ENTRADA_ESTOMAGO.x = x0; }
});
