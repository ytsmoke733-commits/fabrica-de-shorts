// O estômago por dentro, em macro (porte de engolir-chiclete-v2/src/gum.js 89-180, stomachInside, generalizado): esfera
// de raio 4 vista por dentro com dobras que se mexem, piscina de ácido com ondas e respingo, bolhas, o objeto que cai no
// ácido (qualquer THREE.Object3D; padrão uma bolinha de raio 0,22), cristais de açúcar + gotas de sabor saindo dele e 4
// enzimas (bolhas laranja com mandíbula e olhos) que a cena anima. Geometria, cores e luzes do v2.
//   estomagoPorDentro(E, { objeto, enzimas = true, acucar = true, corDesbotada = '#EBC6D2' })
//     -> { scene, objeto, enzimas, pouso, update(t, { … }) }
// Todo quadro é função pura de (t, controles): o update reescreve parede, ácido, objeto (posição, rotação, escala, cor),
// bolhas, açúcar e calendário. As enzimas são da cena: posicione/mostre por quadro e esconda no reset.
import * as THREE from 'three';
import { ellipsoid, smax, noise3, mesh } from '../motor/sdf.js';
import { rnd } from '../motor/lib.js';
import { bolinha, normaisLimpas } from '../objetos.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** 4 enzimas: bolha laranja irregular cortada em mandíbula de cima (userData.up, gire em x para morder) e de baixo, 2 olhos */
function criarEnzimas(scene) {
  const enzM = new THREE.MeshPhysicalMaterial({ color: '#FFB627', roughness: 0.4, clearcoat: 0.6, emissive: '#B86A00', emissiveIntensity: 0.25 });
  const body = (p) => ellipsoid(p, [0, 0, 0], [0.15, 0.12, 0.14]) + 0.012 * noise3(p[0] * 30, p[1] * 30, p[2] * 30);
  const upG = normaisLimpas(mesh((p) => smax(body(p), -(p[1] - 0.004), 0.01), [[-0.18, -0.03, -0.17], [0.18, 0.16, 0.17]], 0.007));
  const loG = normaisLimpas(mesh((p) => smax(body(p), p[1] + 0.004, 0.01), [[-0.18, -0.16, -0.17], [0.18, 0.03, 0.17]], 0.007));
  const eyeM = new THREE.MeshBasicMaterial({ color: '#1A1010' }), eyeW = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  return [0, 1, 2, 3].map(() => {
    const g = new THREE.Group(), up = new THREE.Group(); up.position.set(0, 0, -0.1); g.add(up);
    const u = new THREE.Mesh(upG, enzM); u.position.z = 0.1; up.add(u); g.add(new THREE.Mesh(loG, enzM));
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), eyeW); w.position.set(s * 0.05, 0.075, 0.2); up.add(w); const b = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), eyeM); b.position.set(s * 0.05, 0.075, 0.222); up.add(b); }
    g.visible = false; g.userData.up = up; g.scale.setScalar(0.7); scene.add(g); return g;
  });
}

/** calendário "ANO" (o devaneio dos "7 anos" do v2), criado só no primeiro uso (precisa de document) */
function criarCalendario(scene) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 300; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.04), [0, 1, 2, 3].map(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.6 })).concat([new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#FFFFFF' })])));
  g.position.set(0.36, -0.72, -0.08); g.rotation.set(-0.08, -0.3, 0.05); scene.add(g);
  let chave = '';
  g.desenhar = (txt, sub) => { if (chave === txt + sub) return; chave = txt + sub; const c = cv.getContext('2d'); c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, 256, 300); c.fillStyle = '#D62839'; c.fillRect(0, 0, 256, 70); c.fillStyle = '#FFFFFF'; c.font = '900 40px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ANO', 128, 38); c.fillStyle = '#1A1A1E'; c.font = '900 150px Inter'; c.fillText(txt, 128, 170); c.font = '900 34px Inter'; c.fillText(sub, 128, 268); tex.needsUpdate = true; };
  return g;
}

/**
 * @param E motor (não usado; mantém a assinatura dos mundos)
 * @param o.objeto THREE.Object3D que cai no ácido (padrão: bolinha de raio 0,22). A escala dele na criação é a base do
 *   amassar; as cores dos materiais na criação são a base do desbotar. Raio (açúcar/sabor) = userData.r ou o da caixa.
 * @param o.enzimas cria as 4 enzimas (senão enzimas = [])
 * @param o.acucar cria os cristais de açúcar e as gotas de sabor (controle acucar do update)
 * @param o.corDesbotada cor do objeto com desbotar = 1 (padrão: o GUM_PALE do v2)
 */
export function estomagoPorDentro(E, { objeto, enzimas = true, acucar = true, corDesbotada = '#EBC6D2' } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#3A0A14'); scene.fog = new THREE.FogExp2('#4A0E1C', 0.075);
  // parede: esfera vista por dentro, dobras que correm e se fecham (apertar)
  const geo = new THREE.SphereGeometry(4, 180, 130), pos = geo.attributes.position, base = Float32Array.from(pos.array), seeds = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2]; seeds[i] = noise3(x * 0.7, y * 0.7, z * 0.7); }
  const wallM = new THREE.MeshPhysicalMaterial({ color: '#D9667E', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.22, side: THREE.BackSide, emissive: '#5A1424', emissiveIntensity: 0.4, sheen: 0.5, sheenColor: new THREE.Color('#FFB0C0') });
  scene.add(new THREE.Mesh(geo, wallM));
  const dobras = (t, apertar) => {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], a = Math.atan2(z, x), n0 = seeds[i];
      const wave = 0.5 + 0.5 * Math.sin(y * 1.6 - t * 2.4 + a * 0.5);
      const ridge = Math.pow(Math.abs(Math.sin(a * 9 + n0 * 2.2 + y * 0.35)), 0.35);
      const n = 1 + 0.045 * n0 - (0.05 + 0.05 * wave + 0.04 * apertar) * ridge - 0.04 * apertar * wave;
      pos.array[i * 3] = x * n; pos.array[i * 3 + 1] = y * n; pos.array[i * 3 + 2] = z * n;
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  // piscina de ácido com ondas (e o respingo em anel a partir do pouso)
  const aGeo = new THREE.PlaneGeometry(9, 9, 120, 120); aGeo.rotateX(-Math.PI / 2); const aPos = aGeo.attributes.position, aBase = Float32Array.from(aPos.array);
  const acidM = new THREE.MeshPhysicalMaterial({ color: '#D2C238', roughness: 0.12, transparent: true, opacity: 0.86, emissive: '#6E5A08', emissiveIntensity: 0.35, clearcoat: 1 });
  const acid = new THREE.Mesh(aGeo, acidM); acid.position.y = -1.0; scene.add(acid);
  const GP = V3(0, -0.92, 0);
  const ondas = (t, respingo) => {
    for (let i = 0; i < aPos.count; i++) {
      const x = aBase[i * 3], z = aBase[i * 3 + 2], r = Math.hypot(x - GP.x, z - GP.z);
      let y = 0.018 * Math.sin(x * 3 + t * 1.7) * Math.sin(z * 2.6 - t * 1.3) + 0.012 * Math.sin(r * 9 - t * 4) * Math.exp(-r * 0.6);
      if (respingo >= 0) y += 0.06 * Math.sin(r * 11 - respingo * 14) * Math.exp(-respingo * 2.2) * Math.exp(-Math.pow(r - respingo * 1.6, 2) * 4);
      aPos.array[i * 3 + 1] = y;
    }
    aPos.needsUpdate = true; aGeo.computeVertexNormals();
  };
  const NB = 110, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 18, 12), new THREE.MeshPhysicalMaterial({ color: '#F8EC8A', roughness: 0.1, transparent: true, opacity: 0.7, emissive: '#E8C93A', emissiveIntensity: 0.45 }), NB); scene.add(bub);
  const NS = 40, NF = 16;
  const sug = acucar ? new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, 0.055, 0.055), new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFFFFF', emissiveIntensity: 0.7, roughness: 0.3 }), NS) : null;
  const flav = acucar ? new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshPhysicalMaterial({ color: '#8FF0C8', roughness: 0.15, emissive: '#3FC89A', emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }), NF) : null;
  if (acucar) { sug.count = 0; flav.count = 0; scene.add(sug, flav); }
  const enz = enzimas ? criarEnzimas(scene) : [];
  // o objeto (macro): padrão a bolinha do kit sem brilho, raio 0,22 (o wad(0.22, 0) do v2)
  if (objeto === undefined) { objeto = bolinha({ raio: 0.22 }).mesh; objeto.material.emissiveIntensity = 0; }
  scene.add(objeto);
  const S0 = objeto.scale.clone(), GR = objeto.userData.r ?? new THREE.Box3().setFromObject(objeto).getBoundingSphere(new THREE.Sphere()).radius;
  const PALE = new THREE.Color(corDesbotada), cores = [];
  objeto.traverse((m) => { for (const mt of [].concat(m.material || [])) if (mt.color) cores.push([mt, mt.color.clone()]); });
  let cal = null;
  const key = new THREE.PointLight('#FFD2C2', 8, 16, 1.3); key.position.set(0.9, 1.4, 2.0); scene.add(key);
  const rim = new THREE.PointLight('#FF6F86', 6, 12, 1.4); rim.position.set(-1.6, 0.3, -1.2); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#FF9AA8', '#2A0508', 0.35));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  /** cristais de açúcar + gotas de sabor saindo do objeto: p 0..1 (fora de (0, 1) somem) */
  const acucarSaindo = (p) => {
    sug.count = p > 0 && p < 1 ? NS : 0; flav.count = p > 0 && p < 1 ? NF : 0;
    for (let i = 0; i < sug.count; i++) {
      const k = Math.min(1, Math.max(0, (p - rnd(i) * 0.35) / 0.65)); const a = (0.12 + 0.76 * rnd(i + 7)) * Math.PI, d = GR * 1.05 + k * (0.45 + 0.5 * rnd(i + 33));
      v.set(GP.x + Math.cos(a) * d * 0.5, GP.y + 0.05 + Math.sin(a) * d, GP.z + (rnd(i + 21) - 0.5) * 0.4);
      e.set(k * 5 + i, k * 3 + i * 2, 0); q.setFromEuler(e); sc.setScalar(k <= 0 ? 0.0001 : (1 - k * 0.8) * (0.7 + rnd(i + 44) * 0.6)); m4.compose(v, q, sc); sug.setMatrixAt(i, m4);
    }
    for (let i = 0; i < flav.count; i++) {
      const k = Math.min(1, Math.max(0, (p - rnd(i + 300) * 0.4) / 0.6)); const a = (0.2 + 0.6 * rnd(i + 307)) * Math.PI, d = GR + k * (0.35 + 0.4 * rnd(i + 333));
      v.set(GP.x + Math.cos(a) * d * 0.6, GP.y + 0.05 + Math.sin(a) * d, GP.z + 0.15 + (rnd(i + 321) - 0.5) * 0.3); q.identity(); sc.setScalar(k <= 0 ? 0.0001 : (1 - k) * (0.8 + rnd(i + 344) * 0.6)); m4.compose(v, q, sc); flav.setMatrixAt(i, m4);
    }
    sug.instanceMatrix.needsUpdate = true; flav.instanceMatrix.needsUpdate = true;
  };
  return {
    scene, objeto, enzimas: enz, pouso: GP.clone(),
    /**
     * @param t tempo (s; passe t·0,4 para câmera lenta, como o v2)
     * @param c.bolhas 0..1 quantidade de bolhas (fizz) · c.desbotar 0..1 cor inicial → corDesbotada (pale)
     * @param c.amassar -1..1 achata/estica o objeto (squash) · c.boiar amplitude do sobe-e-desce pousado (bob)
     * @param c.queda 0..1 o objeto cai de 2,6 acima do pouso; 1 = pousado (drop) · c.respingo s desde o impacto, -1 = nada (splash)
     * @param c.apertar 0..1 as dobras se fecham (squeeze) · c.acucar 0..1 açúcar/sabor saindo (o sugar(p) do v2)
     * @param c.calendario [texto, legenda] mostra o calendário "ANO" (calTxt), null esconde · c.cam posição da câmera
     *   (Vector3; esconde bolhas a menos de 0,9 dela)
     */
    update(t, { bolhas = 0.5, desbotar = 0, amassar = 0, boiar = 1, cam = null, queda = 1, respingo = -1, apertar = 0, calendario = null, acucar: pa = 0 } = {}) {
      dobras(t, apertar); ondas(t, respingo);
      const fall = 1 - queda, y0 = GP.y + fall * fall * 2.6;
      objeto.position.set(GP.x, y0 + (queda >= 1 ? Math.sin(t * 2.2) * 0.03 * boiar : 0), GP.z); objeto.rotation.set(Math.sin(t * 0.9) * 0.25 + fall * 4, t * 0.35, Math.sin(t * 1.3) * 0.15);
      objeto.scale.set(S0.x * (1 + 0.3 * amassar), S0.y * (1 - 0.18 * amassar), S0.z * (1 + 0.12 * amassar));
      for (const [mt, c0] of cores) mt.color.copy(c0).lerp(PALE, desbotar);
      bub.count = Math.round(NB * (0.2 + 0.8 * bolhas));
      for (let i = 0; i < bub.count; i++) {
        const a = rnd(i) * Math.PI * 2, r = 0.3 + rnd(i + 50) * 2.4, sp = 0.35 + rnd(i + 90) * 0.5, y = -1.0 + ((rnd(i + 130) * 3 + t * sp) % 2.6);
        v.set(Math.cos(a) * r + Math.sin(t * 2 + i) * 0.03, y, Math.sin(a) * r - 0.4); q.identity(); sc.setScalar((0.5 + rnd(i + 170) * 1.1) * Math.min(1, (y + 1.0) * 6));
        if (cam && v.distanceTo(cam) < 0.9) sc.setScalar(0.0001);
        m4.compose(v, q, sc); bub.setMatrixAt(i, m4);
      }
      bub.instanceMatrix.needsUpdate = true;
      if (acucar) acucarSaindo(pa);
      if (calendario != null) { cal ||= criarCalendario(scene); cal.desenhar(calendario[0], calendario[1]); }
      if (cal) cal.visible = calendario != null;
    },
  };
}
