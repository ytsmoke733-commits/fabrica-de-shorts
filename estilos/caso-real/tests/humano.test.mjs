import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GESTOS } from '../kit/personagem/gestos.mjs';
import { POSE_CORPO_BASE, POSES_CORPO } from '../kit/personagem/poses.mjs';

const THREE = await import('three');
const { Human } = await import('../kit/personagem/humano.js');
// face: false = sem a boca desenhada em canvas (não há document no Node); o corpo e os braços são os mesmos
const h = new Human({ face: false });
const V = () => new THREE.Vector3();
const perto = (a, b, eps) => a.distanceTo(b) < eps;
const emPe = () => h.posar('emPe');

test('engolir: volume de pele no pescoço, invisível fora de 0 < k < 1', () => {
  emPe();
  for (const k of [-0.5, 0, 1, 1.4]) { h.engolir(k); assert.equal(h.gole.visible, false, `k=${k}`); }
  h.engolir(0.5); assert.equal(h.gole.visible, true);
  assert.equal(h.gole.parent, h.spine);
});

test('engolir: desce do queixo para a clavícula, com escala em sino', () => {
  emPe();
  h.engolir(0.2); const y2 = h.gole.position.y, s2 = h.gole.scale.x;
  h.engolir(0.5); const y5 = h.gole.position.y, s5 = h.gole.scale.x;
  h.engolir(0.8); const y8 = h.gole.position.y, s8 = h.gole.scale.x;
  assert.ok(y2 > y5 && y5 > y8, `y desce: ${y2} ${y5} ${y8}`);
  assert.ok(s5 > s2 && s5 > s8, 'maior no meio');
  assert.ok(Math.abs(s2 - s8) < 1e-9, 'sino simétrico');
  h.engolir(0.5); assert.equal(h.gole.position.y, y5, 'função pura de k');
});

test('gesto: k=1 põe a mão no alvo do osso; k=0 é o repouso', () => {
  for (const nome of ['garganta', 'barriga', 'apontar']) {
    emPe(); const g = GESTOS[nome];
    h.gesto(nome, 1);
    const alvo = h[g.osso].localToWorld(new THREE.Vector3(...g.alvo));
    // 8 mm: o pivô da mão do v2 fica 5 mm à frente do eixo do antebraço e o IK do reach() não compensa (igual ao v2)
    assert.ok(perto(h.gripPos(g.lado, V()), alvo, 0.008), `${nome}: mão no alvo`);
  }
  emPe(); h.gesto('garganta', 0); const g0 = h.gripPos('L', V());
  emPe(); h.gesto('repouso', 1); assert.ok(perto(h.gripPos('L', V()), g0, 1e-6), 'k=0 = repouso');
});

test('gesto: lado oposto espelha x (mesma altura e profundidade)', () => {
  emPe(); h.gesto('barriga', 0.6); const l = h.gripPos('L', V());
  emPe(); h.gesto('barriga', 0.6, 0, { lado: 'R' }); const r = h.gripPos('R', V());
  assert.ok(Math.abs(l.x + r.x) < 0.004 && Math.abs(l.y - r.y) < 0.004 && Math.abs(l.z - r.z) < 0.004, `L ${l.toArray()} R ${r.toArray()}`);
});

test('gesto: acenar e coçar a cabeça mexem com t; nome desconhecido lança', () => {
  for (const nome of ['acenar', 'cocarCabeca']) {
    emPe(); h.gesto(nome, 1, 0); const a = h.gripPos(GESTOS[nome].lado, V());
    emPe(); h.gesto(nome, 1, 0.11); const b = h.gripPos(GESTOS[nome].lado, V());
    assert.ok(a.distanceTo(b) > 0.003, nome);
  }
  assert.throws(() => h.gesto('voar', 1), /gesto "voar" não existe/);
});

test('posar: nome do POSES_CORPO ou pose solta; desconhecido lança', () => {
  h.posar('sentado'); assert.equal(h.hips.position.y, POSES_CORPO.sentado.hipsY);
  h.posar('sentado', 0); assert.equal(h.hips.position.y, POSE_CORPO_BASE.hipsY);
  h.posar({ hipsY: 0.6 }, 1, { hipsZ: 0.1 }); assert.equal(h.hips.position.y, 0.6); assert.equal(h.hips.position.z, 0.1);
  assert.throws(() => h.posar('voando'), /pose "voando" não existe/);
});

test('posar(POSE_CORPO_BASE) = pose({}) do Human (base igual aos padrões do v2)', () => {
  const rot = () => [h.arm.L.sh, h.arm.R.sh, h.arm.L.el, h.arm.R.el, h.leg.L.hip, h.leg.R.hip, h.leg.L.kn, h.leg.R.kn, h.spine, h.head].map((o) => o.rotation.toArray().slice(0, 3));
  h.pose({}); const a = rot(); h.posar(POSE_CORPO_BASE); const b = rot();
  a.forEach((r, i) => r.forEach((v, j) => assert.ok(Math.abs(v - b[i][j]) < 1e-9, `osso ${i} eixo ${j}: ${v} vs ${b[i][j]}`)));
});

test('segurar = hold: o objeto vai para o ponto de pegada da mão', () => {
  const o = new THREE.Object3D(); h.segurar('R', o); assert.equal(o.parent, h.arm.R.grip);
});

test('gole nunca projeta sombra, nem depois de setBodyMaterial(null)', () => {
  const m = new THREE.MeshBasicMaterial();
  h.setBodyMaterial(m); assert.equal(h.gole.castShadow, false);
  h.setBodyMaterial(null); assert.equal(h.gole.castShadow, false);
  assert.equal(h.headMesh.castShadow, true, 'as outras partes voltam a fazer sombra');
});
