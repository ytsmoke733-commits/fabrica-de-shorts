import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POSE_CORPO_BASE, POSES_CORPO } from '../kit/personagem/poses.mjs';
import { digitacaoNoTempo } from '../kit/ritmo.mjs';

const THREE = await import('three');
const { pessoa, POSES_CASO, digitar, materialAlvo, materialTestemunha, materialMemoria } = await import('../kit/pessoas.js');

test('pessoa("alvo"): Human sem rosto, todas as parts no mesmo material, que tem emissive', () => {
  const h = pessoa('alvo');
  const m = h.parts[0].material;
  assert.ok(h.parts.length > 10);
  assert.ok(h.parts.every((p) => p.material === m), 'um material só');
  assert.ok(m.emissive instanceof THREE.Color, 'tem emissive');
  assert.equal(h.eyes, undefined, 'sem olhos');
  assert.equal(h.mouth, undefined, 'sem boca');
});

test('pessoa("testemunha") usa ShaderMaterial; memória é o mesmo shader, transparente a 0,45', () => {
  const h = pessoa('testemunha');
  assert.ok(h.parts.every((p) => p.material instanceof THREE.ShaderMaterial));
  const t = materialTestemunha(), mem = materialMemoria();
  assert.equal(mem.fragmentShader, t.fragmentShader, 'mesmo shader');
  assert.equal(mem.transparent, true);
  assert.equal(mem.uniforms.uA.value, 0.45);
  assert.equal(t.transparent, false);
  const mem2 = pessoa('memoria');
  assert.ok(mem2.parts.every((p) => p.material.transparent && p.renderOrder === 2));
  assert.ok(mem2.parts.every((p) => p.children.some((c) => c.material.colorWrite === false && c.renderOrder === 1)), 'pré-passada de profundidade');
});

test('materialAlvo(i): intensidade do brilho e volume por N·V no shader (centro 0,6, borda 1,0 + borda quente)', () => {
  const m = materialAlvo();
  assert.equal(m.emissiveIntensity, 2.2);
  assert.equal(materialAlvo(0.5).emissiveIntensity, 0.5);
  assert.equal(m.emissive.getHexString(), 'e4322b', 'emissive no tom do alvo');
  const sh = { uniforms: {}, fragmentShader: 'void main(){\n#include <emissivemap_fragment>\n}' };
  m.onBeforeCompile(sh);
  assert.match(sh.fragmentShader, /#include <emissivemap_fragment>\s+float nvAlvo/, 'injeta depois do emissive');
  assert.equal(sh.uniforms.uCentro.value, 0.6);
  m.emissiveIntensity = 0.3; assert.equal(sh.uniforms.emissiveIntensityAlvo.value, 0.3, 'acompanha o emissiveIntensity');
});

test('pessoa: tipo desconhecido lança; opções vão para o Human (face sempre false)', () => {
  assert.throws(() => pessoa('xyz'), /pessoa "xyz" não existe/);
  const h = pessoa('testemunha', { scale: 0.9, face: true });
  assert.equal(h.group.scale.x, 0.9);
  assert.equal(h.eyes, undefined, 'face: true é ignorado: pessoa do caso nunca tem rosto');
});

test('POSES_CASO: as 5 poses existem e só usam chaves do POSES_CORPO', () => {
  const chaves = new Set(Object.keys(POSE_CORPO_BASE));
  for (const nome of ['sentadoDigitando', 'sentadoOlhando', 'emPeOlhando', 'deCostas', 'bracosCruzados']) {
    assert.ok(POSES_CASO[nome], nome);
    for (const k of Object.keys(POSES_CASO[nome])) assert.ok(chaves.has(k), `${nome}.${k}`);
  }
  assert.deepEqual(POSES_CASO.deCostas, POSES_CORPO.emPe, 'de costas = em pé (a rotação é do grupo)');
});

test('sentadoDigitando: quadril na altura da cadeira do kit, pernas 88°, pés no chão', () => {
  const p = POSES_CASO.sentadoDigitando;
  assert.equal(p.hipsY, 0.53);
  assert.deepEqual(p.hipL, [88, 0, 2]); assert.deepEqual(p.hipR, [88, 0, 2]);
  assert.equal(p.knL, 88); assert.equal(p.knR, 88);
  const h = pessoa('alvo'); h.posar(p);
  // ponto mais baixo da canela/sapato (malha filha do joelho) encostando no chão (±3 cm)
  let min = Infinity; const v = new THREE.Vector3();
  for (const lado of ['L', 'R']) {
    const malha = h.leg[lado].kn.children[0], pos = malha.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); malha.localToWorld(v); min = Math.min(min, v.y); }
  }
  assert.ok(Math.abs(min) < 0.03, `pé em y=${min.toFixed(3)}`);
});

test('digitar: palma para baixo + ritmo de digitacaoNoTempo nos cotovelos e punhos depois do posar; k=0 não mexe', () => {
  const h = pessoa('alvo'), D = THREE.MathUtils.degToRad, t = 1.37, V = () => new THREE.Vector3();
  const rot = () => ['L', 'R'].flatMap((l) => [h.arm[l].el.rotation.toArray().slice(0, 3), h.arm[l].hand.rotation.toArray().slice(0, 3)]).flat();
  h.posar(POSES_CASO.sentadoDigitando); const r0 = rot(), el0 = h.arm.L.el.rotation.x, pz0 = h.arm.R.hand.rotation.z;
  digitar(h, t, 0); assert.deepEqual(rot(), r0, 'k=0');
  h.posar(POSES_CASO.sentadoDigitando); digitar(h, t, 1);
  const d = digitacaoNoTempo(t);
  assert.ok(Math.abs(h.arm.L.el.rotation.x - (el0 - D(d.elL))) < 1e-9, 'cotovelo L');
  assert.ok(Math.abs(h.arm.R.hand.rotation.z - (pz0 - D(18 + d.punhoR))) < 1e-9, 'punho R');
  for (const l of ['L', 'R']) {   // palma (lado da pegada, -s·x no punho) virada para baixo
    const q = h.arm[l].hand.getWorldQuaternion(new THREE.Quaternion());
    assert.ok(new THREE.Vector3(-h.arm[l].s, 0, 0).applyQuaternion(q).y < -0.8, `palma ${l} para baixo`);
  }
  // mãos na altura do teclado das mesas do kit (tampo 0,74 + teclado 0,022) e ~0,5 m à frente do quadril
  for (const l of ['L', 'R']) { const g = h.gripPos(l, V()); assert.ok(g.y > 0.74 && g.y < 0.86 && g.z > 0.4 && g.z < 0.6, `mão ${l} ${g.toArray()}`); }
  h.posar(POSES_CASO.sentadoDigitando); digitar(h, t, 1); const a = h.gripPos('L', V());
  h.posar(POSES_CASO.sentadoDigitando); digitar(h, t, 1); assert.ok(h.gripPos('L', V()).distanceTo(a) < 1e-12, 'função pura de t');
});
