import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { vasoSanguineo } = await import('../kit/corpo/vaso.js');

const V = vasoSanguineo(null);
const parede = (X) => X.scene.children.find((c) => c.isMesh && !c.isInstancedMesh && c.material.side === THREE.BackSide);
const posicoes = (X) => { const m = new THREE.Matrix4(), p = new THREE.Vector3(), out = []; for (let i = 0; i < X.hemacias.count; i++) { X.hemacias.getMatrixAt(i, m); out.push(p.setFromMatrixPosition(m).clone()); } return out; };
/** s (m) do ponto da curva mais perto de p (busca em 2000 amostras) */
const sDe = (X, p) => { let best = 0, bd = Infinity; for (let i = 0; i <= 2000; i++) { const d = X.curve.getPointAt(i / 2000).distanceToSquared(p); if (d < bd) { bd = d; best = i / 2000; } } return best * X.LEN; };
const raioMedio = (X) => { const p = parede(X).geometry.attributes.position, c = X.curve.getPointAt(0.5), NS = 48, NR = 400, i = NR / 2; let s = 0; for (let j = 0; j < NS; j++) { const k = i * (NS + 1) + j; s += c.distanceTo(new THREE.Vector3(p.getX(k), p.getY(k), p.getZ(k))); } return s / NS; };
const snap = (X) => JSON.stringify([Array.from(parede(X).geometry.attributes.position.array), Array.from(X.hemacias.instanceMatrix.array), X.leucocito && [X.leucocito.position.toArray(), X.leucocito.rotation.toArray()]]);

test('vasoSanguineo: túnel numa curva suave de ~40 m, parede vermelho-escura translúcida, 420 hemácias, leucócito branco', () => {
  assert.ok(V.LEN > 36 && V.LEN < 46, `LEN ${V.LEN}`);
  const w = parede(V); assert.ok(w.material.transparent && w.material.opacity < 1);
  const hsl = w.material.color.getHSL({}, THREE.SRGBColorSpace); assert.ok((hsl.h < 0.05 || hsl.h > 0.95) && hsl.l < 0.4, 'vermelho-escura');
  assert.ok(V.hemacias.isInstancedMesh); assert.equal(V.hemacias.count, 420); assert.equal(V.hemacias.parent, V.scene);
  assert.ok(V.leucocito.isMesh); assert.equal(V.leucocito.parent, V.scene);
  const c = V.leucocito.material.color.getHSL({}, THREE.SRGBColorSpace); assert.ok(c.l > 0.8, 'branco');
  const X = vasoSanguineo(null, { hemacias: 50, leucocito: false });
  assert.equal(X.hemacias.count, 50); assert.equal(X.leucocito, null);
});

test('vasoSanguineo: hemácia é um disco bicôncavo (mais fino no centro que perto da borda)', () => {
  const p = V.hemacias.geometry.attributes.position; let centro = 0, borda = 0;
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)), y = Math.abs(p.getY(i)); if (r < 0.1) centro = Math.max(centro, y); if (r > 0.7 && r < 0.85) borda = Math.max(borda, y); }
  assert.ok(centro > 0 && borda > centro * 2, `centro ${centro}, borda ${borda}`);
  V.hemacias.geometry.computeBoundingBox(); const b = V.hemacias.geometry.boundingBox;
  assert.ok(b.max.x - b.min.x > 4 * (b.max.y - b.min.y), 'achatado');
});

test('vaso.update: as hemácias andam no sentido da curva, cada uma na sua velocidade; fluxo 0 para', () => {
  V.update(10, { cam: null }); const a = posicoes(V).slice(0, 40);
  V.update(10.5, { cam: null }); const b = posicoes(V).slice(0, 40);
  const ds = a.map((p, i) => { let d = sDe(V, b[i]) - sDe(V, p); if (d < -V.LEN / 2) d += V.LEN; return d; });
  assert.ok(ds.every((d) => d > 0), 'todas para a frente'); assert.ok(Math.max(...ds) > 1.5 * Math.min(...ds), 'velocidades diferentes');
  V.update(10, { fluxo: 0 }); const c = posicoes(V); V.update(13, { fluxo: 0 }); const d = posicoes(V);
  assert.ok(c.every((p, i) => p.distanceTo(d[i]) < 1e-9));
});

test('vaso.update: o leucócito anda mais devagar que a média das hemácias', () => {
  V.update(10, {}); const l0 = sDe(V, V.leucocito.position), h0 = posicoes(V).slice(0, 60);
  V.update(10.5, {}); const l1 = sDe(V, V.leucocito.position), h1 = posicoes(V).slice(0, 60);
  const media = h0.reduce((s, p, i) => { let d = sDe(V, h1[i]) - sDe(V, p); if (d < -V.LEN / 2) d += V.LEN; return s + d; }, 0) / h0.length;
  assert.ok(l1 - l0 > 0 && l1 - l0 < media * 0.5, `leucócito ${l1 - l0} vs média ${media}`);
});

test('vaso.update: a parede pulsa no ritmo cardíaco (período 60/bpm)', () => {
  const raios = []; for (let k = 0; k < 40; k++) { V.update(k * 0.025, { bpm: 72 }); raios.push(raioMedio(V)); }
  assert.ok(Math.max(...raios) / Math.min(...raios) > 1.03, 'pulsa');
  V.update(0.3, { bpm: 72 }); const r1 = raioMedio(V); V.update(0.3 + 60 / 72, { bpm: 72 }); assert.ok(Math.abs(raioMedio(V) - r1) < 1e-6, 'periódico');
});

test('vaso: determinístico por índice (dois vasos iguais no mesmo t) e update função pura de (t, controles)', () => {
  const X = vasoSanguineo(null);
  V.update(4.2, { fluxo: 1.2, bpm: 80 }); X.update(4.2, { fluxo: 1.2, bpm: 80 }); assert.equal(snap(X), snap(V));
  const A = { fluxo: 0.8, bpm: 90, cam: V.ponto(12) };
  V.update(3.3, A); const a = snap(V); V.update(8, { fluxo: 2, bpm: 60, cam: V.ponto(30) }); V.update(3.3, A);
  assert.equal(snap(V), a);
});
