// Raio-x do deep-dive (porte de engolir-chiclete-v2: src/core/sets.js 156-189 e src/shots.js 74-84, 264-269):
//   xrayMaterial(cor, forca)                   vidro de raio-x (shader aditivo com fresnel)
//   xrayStage(E)                               -> { scene, update() }  palco escuro com grade ciano
//   orgaos(humano)                             -> { group, stomach, heart, lungs, ribs, focar(on), update(t, { bpm, respira }) }
//                                                 ossos e órgãos presos ao spine do humano; coração bate e pulmões respiram
//   humanoRaioX({ cor, forca, ...opcoesDoHuman }) um Human de vidro (corpo e cabeça), com .xmat e .cabecaVidro(on)
//   crossfadeRaioX(ctx, desenharNormal, desenharRaioX, mix, flash)  dissolve da cena normal para o raio-x, flash ciano
// O raio-x é o MESMO corpo na mesma pose e câmera: pose o humano normal e o humanoRaioX com a mesma função por quadro.
// Tudo é função pura de t (update/focar escrevem o estado inteiro que tocam).
import * as THREE from 'three';
import { capsule, ellipsoid, smin, sphere, mesh } from '../motor/sdf.js';
import { W, H } from '../motor/lib.js';
import { canvasTex } from '../casa.js';
import { Human } from '../personagem/humano.js';

export function xrayMaterial(cor = '#4FD1E8', forca = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(cor) }, uS: { value: forca } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uS; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uCol * (0.06 + f * 1.6) * uS, 1.0); }',
  });
}

/** palco do raio-x: fundo azul-noite em degradê, luz fria e a grade ciano no chão. E fica na assinatura do v2 (não usado). */
export function xrayStage(E) {
  const scene = new THREE.Scene();
  scene.background = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0B1A30'); gr.addColorStop(1, '#03070F'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#9FD9FF', '#05080F', 0.6));
  const k = new THREE.DirectionalLight('#DDF4FF', 2.2); k.position.set(2, 3, 3); scene.add(k);
  const grid = new THREE.GridHelper(20, 40, '#1F6F88', '#123A4A'); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  return { scene, update() {} };
}

/** pulso do coração 0..1 numa batida (fase 0..1): "tum-tum" (pico 1 e um segundo pico de 0,55), circular na fase */
function pulso(fase) {
  const bump = (c, w) => { let d = fase - c; d -= Math.round(d); return Math.exp(-((d / w) ** 2)); };
  return Math.min(1, bump(0.08, 0.05) + 0.55 * bump(0.3, 0.05));
}

/**
 * ossos + órgãos do insides() do v2 dentro do tronco do `humano` (o group vira filho de humano.spine). O estômago fica
 * translúcido como no raio-x do v2 (shots.js 76). ribs = costelas, esterno e clavículas (o RIBS de shots.js 77).
 * update(t, { bpm = 72, respira = 14 }): coração com escala 1 + 0,08·pulso no ritmo bpm; pulmões 1 + 0,05·seno no
 * ritmo respira por minuto. focar(on): esconde ribs, coração e pulmões (para ver esôfago/estômago; focusX do v2).
 */
export function orgaos(humano) {
  const g = new THREE.Group();
  const bone = new THREE.MeshStandardMaterial({ color: '#E6F7FF', emissive: '#7FDDF2', emissiveIntensity: 0.28, roughness: 0.4 });
  const spineGeo = new THREE.CylinderGeometry(0.018, 0.02, 0.03, 16), ribs = [];
  for (let i = 0; i < 17; i++) { const v = new THREE.Mesh(spineGeo, bone); v.position.set(0, -0.05 + i * 0.034, -0.085 + Math.sin(i / 16 * Math.PI) * 0.015); g.add(v); }
  for (let i = 0; i < 9; i++) { const r = 0.12 + Math.sin(Math.min(1, i / 4) * 1.4) * 0.05 - (i > 5 ? (i - 5) * 0.012 : 0); const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0085, 8, 48, Math.PI * 1.55), bone); rib.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.725); rib.scale.set(1.2, 0.85, 1); rib.position.set(0, 0.47 - i * 0.04, -0.02); g.add(rib); ribs.push(rib); }
  const sternum = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.18, 6, 12), bone); sternum.position.set(0, 0.33, 0.1); g.add(sternum); ribs.push(sternum);
  for (const s of [-1, 1]) { const cl = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.14, 6, 12), bone); cl.rotation.z = Math.PI / 2 + s * 0.15; cl.position.set(s * 0.09, 0.47, 0.06); g.add(cl); ribs.push(cl); }
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 10, 40, Math.PI), bone); pelvis.rotation.x = Math.PI / 2 + 0.6; pelvis.position.set(0, -0.06, 0); g.add(pelvis);
  const organ = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.3, emissive: col, emissiveIntensity: 0.18 });
  const stomach = new THREE.Mesh(mesh((p) => { let d = capsule(p, [-0.02, 0.1, 0], [-0.07, 0.02, 0.01], 0.045, 0.06); d = smin(d, capsule(p, [-0.07, 0.02, 0.01], [0.03, -0.03, 0.02], 0.06, 0.045), 0.04); d = smin(d, capsule(p, [0.03, -0.03, 0.02], [0.07, 0.02, 0.02], 0.045, 0.028), 0.03); return smin(d, capsule(p, [-0.02, 0.1, 0], [-0.01, 0.2, -0.02], 0.016), 0.02); }, [[-0.15, -0.11, -0.09], [0.13, 0.24, 0.1]], 0.005), organ('#E87A8C'));
  stomach.position.set(0.03, 0.14, 0.02); g.add(stomach);
  stomach.material.transparent = true; stomach.material.opacity = 0.55; stomach.material.depthWrite = false;
  const heart = new THREE.Mesh(mesh((p) => smin(smin(sphere(p, [-0.018, 0.02, 0], 0.035), sphere(p, [0.018, 0.02, 0], 0.035), 0.02), ellipsoid(p, [0, -0.02, 0], [0.04, 0.05, 0.035]), 0.03), [[-0.07, -0.08, -0.06], [0.07, 0.07, 0.06]], 0.004), organ('#D62839'));
  heart.position.set(0.025, 0.36, 0.03); heart.rotation.z = -0.4; g.add(heart);
  const lungs = [];
  for (const s of [-1, 1]) { const lung = new THREE.Mesh(mesh((p) => ellipsoid(p, [0, 0, 0], [0.06, 0.11, 0.07]), [[-0.08, -0.13, -0.09], [0.08, 0.13, 0.09]], 0.008), new THREE.MeshPhysicalMaterial({ color: '#F2A3AE', roughness: 0.6, transparent: true, opacity: 0.35, emissive: '#F2A3AE', emissiveIntensity: 0.1, depthWrite: false })); lung.position.set(s * 0.085, 0.36, 0); g.add(lung); lungs.push(lung); }
  g.position.y = 0.04; humano.spine.add(g);
  const focar = (on) => { ribs.forEach((r) => (r.visible = !on)); heart.visible = !on; lungs.forEach((l) => (l.visible = !on)); };
  const update = (t, { bpm = 72, respira = 14 } = {}) => {
    const fase = ((t * bpm) / 60) % 1;
    heart.scale.setScalar(1 + 0.08 * pulso(fase < 0 ? fase + 1 : fase));
    const ar = 1 + 0.05 * Math.sin(2 * Math.PI * (respira / 60) * t);
    lungs.forEach((l) => l.scale.setScalar(ar));
  };
  return { group: g, stomach, heart, lungs, ribs, focar, update };
}

/**
 * um Human de vidro: setBodyMaterial(xrayMaterial(cor, forca)) e a cabeça também em vidro (o truque xHead do v2,
 * shots.js 83-84: as malhas da cabeça trocam de material e olhos/pálpebras/sobrancelhas/boca somem).
 * Devolve o próprio Human com h.xmat (o material, para mudar a cor por quadro) e h.cabecaVidro(on).
 */
export function humanoRaioX({ cor = '#4FD1E8', forca = 0.85, ...opcoesDoHuman } = {}) {
  const h = new Human(opcoesDoHuman), xmat = xrayMaterial(cor, forca);
  h.setBodyMaterial(xmat);
  h.xmat = xmat;
  h.cabecaVidro = (on) => {
    for (const c of h.head.children) {
      if (h.parts.includes(c)) c.material = on ? xmat : c.userData.mat0;
      else c.visible = !on;
    }
    return h;
  };
  return h.cabecaVidro(true);
}

/**
 * crossfade da cena normal para o raio-x (shots.js 264-269). desenharNormal()/desenharRaioX() renderizam a sua cena e
 * fazem o blit no ctx. mix 0..1: com mix < 1 desenha a normal; com mix > 0 desenha o raio-x por cima com
 * globalAlpha = mix e, durante a troca, um flash ciano de força `flash`·sen(mix·π) (0 = sem flash).
 */
export function crossfadeRaioX(ctx, desenharNormal, desenharRaioX, mix, flash = 0.35) {
  if (mix < 1) desenharNormal();
  if (mix > 0) {
    ctx.globalAlpha = mix; desenharRaioX(); ctx.globalAlpha = 1;
    if (mix < 1 && flash > 0) { ctx.fillStyle = `rgba(79,209,232,${flash * Math.sin(mix * Math.PI)})`; ctx.fillRect(0, 0, W, H); }
  }
}
