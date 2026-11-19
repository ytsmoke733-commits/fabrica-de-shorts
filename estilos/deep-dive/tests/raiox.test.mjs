import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { xrayMaterial, orgaos, humanoRaioX, crossfadeRaioX } = await import('../kit/corpo/raiox.js');
const { Human } = await import('../kit/personagem/humano.js');

test('xrayMaterial: shader aditivo com a cor e a força pedidas (padrão ciano, 1)', () => {
  const a = xrayMaterial(), b = xrayMaterial('#FF0000', 0.5);
  assert.ok(a instanceof THREE.ShaderMaterial);
  assert.equal(a.blending, THREE.AdditiveBlending); assert.equal(a.transparent, true); assert.equal(a.depthWrite, false);
  assert.equal(a.uniforms.uCol.value.getHexString(), new THREE.Color('#4FD1E8').getHexString()); assert.equal(a.uniforms.uS.value, 1);
  assert.equal(b.uniforms.uCol.value.getHexString(), new THREE.Color('#FF0000').getHexString()); assert.equal(b.uniforms.uS.value, 0.5);
});

const h = new Human({ face: false }), O = orgaos(h);

test('orgaos: preso ao spine do humano; coração, 2 pulmões, estômago e 12 ossos de costela (9 costelas, esterno, 2 clavículas)', () => {
  assert.equal(O.group.parent, h.spine);
  for (const m of [O.heart, O.stomach, ...O.lungs, ...O.ribs]) assert.equal(m.parent, O.group);
  assert.equal(O.lungs.length, 2); assert.equal(O.ribs.length, 12);
  assert.equal(O.ribs.filter((r) => r.geometry.type === 'TorusGeometry').length, 9);
});

test('orgaos.focar: esconde costelas, coração e pulmões (o estômago fica); focar(false) volta', () => {
  const vis = () => [...O.ribs, O.heart, ...O.lungs].map((m) => m.visible);
  O.focar(true); assert.ok(vis().every((v) => !v)); assert.equal(O.stomach.visible, true);
  O.focar(false); assert.ok(vis().every((v) => v));
});

test('orgaos.update: coração bate (1 a 1,08) no ritmo bpm, periódico, função pura de t', () => {
  const esc = (t, o) => (O.update(t, o), O.heart.scale.x);
  const per = 60 / 72, amostras = Array.from({ length: 200 }, (_, i) => esc(i / 200 * per));
  const max = Math.max(...amostras), min = Math.min(...amostras);
  assert.ok(Math.abs(max - 1.08) < 0.002, `pico ${max}`); assert.ok(Math.abs(min - 1) < 0.002, `repouso ${min}`);
  for (const t of [0.13, 0.77, 2.4]) assert.ok(Math.abs(esc(t) - esc(t + per)) < 1e-9, `período em ${t}`);
  assert.ok(Math.abs(esc(0.3, { bpm: 120 }) - esc(0.3 + 0.5, { bpm: 120 })) < 1e-9, 'bpm 120 → período 0,5 s');
  const a = esc(1.234); esc(5.1); assert.equal(esc(1.234), a, 'nada carrega de um quadro para outro');
  assert.equal(O.heart.scale.x, O.heart.scale.y); assert.equal(O.heart.scale.x, O.heart.scale.z);
});

test('orgaos.update: pulmões respiram 1 + 0,05·seno no ritmo respira por minuto', () => {
  const quarto = 60 / 14 / 4;
  O.update(0); assert.ok(Math.abs(O.lungs[0].scale.x - 1) < 1e-9);
  O.update(quarto); for (const l of O.lungs) assert.ok(Math.abs(l.scale.x - 1.05) < 1e-9 && l.scale.y === l.scale.x);
  O.update(3 * quarto); assert.ok(Math.abs(O.lungs[1].scale.x - 0.95) < 1e-9);
  O.update(60 / 20 / 4, { respira: 20 }); assert.ok(Math.abs(O.lungs[0].scale.x - 1.05) < 1e-9);
});

test('humanoRaioX: corpo e cabeça no material de raio-x; cabecaVidro(false) devolve só a cabeça; ninguém faz sombra', () => {
  const x = humanoRaioX({ face: false, cor: '#00FF88', forca: 0.7 });
  assert.ok(x instanceof Human);
  assert.equal(x.xmat.uniforms.uCol.value.getHexString(), new THREE.Color('#00FF88').getHexString()); assert.equal(x.xmat.uniforms.uS.value, 0.7);
  assert.ok(x.parts.every((p) => p.material === x.xmat), 'tudo em vidro');
  assert.ok(x.parts.every((p) => !p.castShadow), 'sem sombra');
  const extra = new THREE.Object3D(); x.head.add(extra);          // olhos/pálpebras/sobrancelhas/boca: filhos da cabeça fora de parts
  x.cabecaVidro(true); assert.equal(extra.visible, false);
  x.cabecaVidro(false);
  assert.equal(extra.visible, true);
  assert.equal(x.headMesh.material, x.headMesh.userData.mat0, 'cabeça volta ao material original');
  assert.equal(x.parts.find((p) => p.parent === x.spine && p !== x.gole).material, x.xmat, 'corpo segue em vidro');
  const d = humanoRaioX({ face: false });
  assert.equal(d.xmat.uniforms.uCol.value.getHexString(), new THREE.Color('#4FD1E8').getHexString()); assert.equal(d.xmat.uniforms.uS.value, 0.85);
});

/** ctx falso: registra a ordem das chamadas e o globalAlpha vigente em cada uma */
function ctxFalso() {
  const log = [];
  const c = { globalAlpha: 1, fillStyle: '', fillRect: (...a) => log.push(['fillRect', c.fillStyle, c.globalAlpha, ...a]) };
  return { c, log, normal: () => log.push(['normal', c.globalAlpha]), raiox: () => log.push(['raiox', c.globalAlpha]) };
}

test('crossfadeRaioX: mix 0 só a cena normal; mix 1 só o raio-x, sem flash', () => {
  let f = ctxFalso(); crossfadeRaioX(f.c, f.normal, f.raiox, 0); assert.deepEqual(f.log, [['normal', 1]]);
  f = ctxFalso(); crossfadeRaioX(f.c, f.normal, f.raiox, 1); assert.deepEqual(f.log, [['raiox', 1]]); assert.equal(f.c.globalAlpha, 1);
});

test('crossfadeRaioX: no meio, normal e depois raio-x com globalAlpha = mix, alpha volta a 1 e flash ciano em sino', () => {
  const f = ctxFalso(); crossfadeRaioX(f.c, f.normal, f.raiox, 0.5);
  assert.deepEqual(f.log.slice(0, 2), [['normal', 1], ['raiox', 0.5]]);
  assert.equal(f.log[2][0], 'fillRect'); assert.equal(f.log[2][1], 'rgba(79,209,232,0.35)'); assert.equal(f.log[2][2], 1);
  assert.deepEqual(f.log[2].slice(3), [0, 0, 1080, 1920]);
  assert.equal(f.c.globalAlpha, 1);
  const g = ctxFalso(); crossfadeRaioX(g.c, g.normal, g.raiox, 0.5, 0); assert.equal(g.log.length, 2, 'flash 0 = sem flash');
  const k = ctxFalso(); crossfadeRaioX(k.c, k.normal, k.raiox, 0.25, 0.6); assert.equal(k.log[2][1], `rgba(79,209,232,${0.6 * Math.sin(0.25 * Math.PI)})`);
});
