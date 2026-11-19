// Rua à noite, molhada de chuva: a rua corre em x; a calçada de cá (z 0 → 3, meio-fio em z 0) tem o poste aceso, a de lá
// (z −7 → −10) termina nos prédios escuros com 3 janelas acesas. O chão é molhado (roughness 0,2): o poste se reflete nele.
// Feita para ser vista da calçada de cá olhando para −x (x ≈ 6, z ≈ 2,5): é desse lado que ficam as janelas e o reflexo.
// A luz da cena é o poste (luminária com cone); as janelas e os faróis do carro são detalhe, não luz.
//   const R = rua() → { scene, pontos, atualizar(t, { chuva, carro }) }
//   pontos.poste: chão debaixo da lâmpada · pontos.calcada: [esquerda, direita] do caminho de quem anda (z 0,8), passando
//   debaixo do poste · pontos.janelas: centros das janelas acesas
//   R.atualizar(t, { chuva: 0..1, carro })   chuva = parte das gotas visíveis; carro 0..1 = o carro passando ao fundo
//   (pista de lá, da esquerda para a direita, faróis acesos); escondido com carro < 0 ou > 1
// Câmera: o cone do poste tem 1,35 m de raio no chão em pontos.poste — mantenha a câmera fora dele.
import * as THREE from 'three';
import { luminaria } from '../luz.js';
import { gotaDeChuva } from '../ritmo.mjs';
import { rnd } from '../motor/lib.js';

const CALCADA = 0.15, ALTURA_POSTE = 4.6, I_POSTE = 42, GOTAS = 1400, PISTA_CARRO = -5.0, CARRO_X = [-24, 18];
const POSTE = { x: 0.2, z: 1.55 }, LAMPADA = { x: 0.2, z: 0.75 };            // pé do poste e a lâmpada (braço sobre a calçada)
const CHUVA = { x: -9, w: 15, y: 0, h: 7, z0: -6.5, z1: 3 };                  // caixa da chuva (y de baixo para cima)
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const caixa = (w, h, d, m, x, y, z, pai) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; o.position.set(x, y, z); pai.add(o); return o; };
function texturaCanvas(w, h, desenho, repetir = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetir); }
  return t;
}
/** brilho redondo (aditivo) para farol, lanterna e reflexo no asfalto */
let texBrilho = null;
const brilho = () => (texBrilho ??= texturaCanvas(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
}));
const aditivo = (cor, k) => new THREE.MeshBasicMaterial({ map: brilho(), color: new THREE.Color(cor).multiplyScalar(k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

export function rua() {
  // céu da cidade um pouco mais claro que os prédios (eles leem como silhueta) e a névoa da mesma cor
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0E1424'); scene.fog = new THREE.Fog('#0E1424', 10, 46);

  // asfalto molhado com faixa tracejada apagada; calçadas de placas; meio-fio
  const asfalto = texturaCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#4A505C'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = rnd(i) > 0.5 ? 'rgba(20,22,28,0.35)' : 'rgba(110,116,130,0.25)'; g.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2, 2); }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(15,17,22,0.45)'; g.beginPath(); g.ellipse(rnd(i + 40) * w, rnd(i + 50) * h, 40 + rnd(i) * 60, 14 + rnd(i + 9) * 18, 0, 0, Math.PI * 2); g.fill(); }   // poças
  }, [8, 2]);
  caixa(60, 0.1, 7, std('#20242C', 0.2, { map: asfalto }), 0, -0.05, -3.5, scene);
  const faixa = std('#5A5A52', 0.3);
  for (let x = -28; x < 28; x += 3.2) caixa(1.6, 0.012, 0.12, faixa, x, 0.006, -3.5, scene);
  const placas = texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#5E6470'; g.fillRect(0, 0, w, h); g.fillStyle = '#2E323C'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(30,32,40,0.3)'; g.fillRect(rnd(i + 7) * w, rnd(i + 8) * h, 3, 3); }
  }, [60 / 0.8, 3 / 0.8]);
  const calcada = std('#262A33', 0.2, { map: placas });
  caixa(60, CALCADA, 3, calcada, 0, CALCADA / 2, 1.5, scene);
  const placas2 = placas.clone(); placas2.needsUpdate = true; placas2.repeat.set(60 / 0.8, 3 / 0.8);
  caixa(60, CALCADA, 3, std('#262A33', 0.2, { map: placas2 }), 0, CALCADA / 2, -8.5, scene);
  const guia = std('#3A3E46', 0.35);
  caixa(60, CALCADA + 0.02, 0.14, guia, 0, (CALCADA + 0.02) / 2, 0.07, scene); caixa(60, CALCADA + 0.02, 0.14, guia, 0, (CALCADA + 0.02) / 2, -7.07, scene);

  // prédios escuros dos dois lados: fachadas com grade de janelas apagadas
  const fachada = texturaCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#3A404C'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) { g.fillStyle = '#121519'; g.fillRect(18 + c * 60, 26 + r * 54, 40, 34); g.fillStyle = '#4A505C'; g.fillRect(14 + c * 60, 62 + r * 54, 48, 4); }
  });
  const predio = (x, w, alt, z, d, pai, rx = 1) => {
    const t = fachada.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 4 * rx, alt / 8);
    const f = std('#FFFFFF', 0.85, { map: t, color: '#6A7080' }), lado = std('#14171D', 0.9);
    const o = caixa(w, alt, d, [lado, lado, lado, lado, f, f], x, alt / 2 + CALCADA, z, pai); return o;
  };
  const BLOCOS = [[-17, 7, 11], [-9.6, 6.6, 8], [-3.2, 5.4, 13], [2.8, 5.8, 9], [9.4, 6.6, 12], [16.5, 7, 7.5]];
  BLOCOS.forEach(([x, w, alt]) => predio(x, w, alt, -10 - 2, 4, scene));
  // de cá (atrás da calçada do poste): mais baixo, com a porta de uma loja fechada
  [[-12, 8, 6], [-4, 7.6, 4.6], [4.2, 8.4, 7]].forEach(([x, w, alt]) => predio(x, w, alt, 3 + 2, 4, scene));
  caixa(2.2, 2.4, 0.06, std('#0D1015', 0.4, { metalness: 0.6 }), -3.0, 1.2 + CALCADA, 2.98, scene);           // porta de aço da loja
  // 3 janelas acesas do outro lado da rua (detalhe), no trecho que se vê de quem olha pela calçada (−x): duas quentes,
  // uma fria de televisão; cada uma com a cortina meio fechada
  const janelas = [[-18.6, 4.1, '#F1D9A6', 0.6], [-15.4, 7.3, '#F1D9A6', 0.45], [-13.2, 2.9, '#8FA8E0', 0.5]].map(([x, y, cor, k]) => {
    const j = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.75), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k) }));
    j.position.set(x, y + CALCADA, -10 + 0.02); scene.add(j);
    const cortina = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.75), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k * 0.4) }));
    cortina.position.set(x - 0.29, y + CALCADA, -10 + 0.025); scene.add(cortina);
    return new THREE.Vector3(x, y + CALCADA, -10);
  });

  // o poste: coluna, braço sobre a rua e a luminária com cone (a luz da cena)
  const metal = std('#1C2029', 0.4, { metalness: 0.6 });
  const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, ALTURA_POSTE, 16), metal); coluna.castShadow = true;
  coluna.position.set(POSTE.x, CALCADA + ALTURA_POSTE / 2, POSTE.z); scene.add(coluna);
  caixa(0.06, 0.06, POSTE.z - LAMPADA.z + 0.2, metal, POSTE.x, CALCADA + ALTURA_POSTE - 0.05, (POSTE.z + LAMPADA.z) / 2 - 0.1, scene);
  caixa(0.5, 0.1, 0.4, metal, LAMPADA.x, CALCADA + ALTURA_POSTE + 0.03, LAMPADA.z, scene);
  const L = luminaria(scene, LAMPADA.x, CALCADA + ALTURA_POSTE - 0.04, LAMPADA.z, I_POSTE);
  // o reflexo do poste no chão molhado: um rastro de luz esticado na direção de quem olha pela calçada (+x), por cima do
  // brilho real da SpotLight no asfalto
  const reflexo = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 4.2), aditivo('#F6DDAE', 0.3));
  reflexo.rotation.set(-Math.PI / 2, 0, Math.PI / 2); reflexo.position.set(LAMPADA.x + 2.0, CALCADA + 0.004, LAMPADA.z); scene.add(reflexo);
  // lixeira e hidrante na calçada (silhuetas para a luz bater)
  const lixeira = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.75, 20), std('#1A1E25', 0.5, { metalness: 0.3 })); lixeira.castShadow = lixeira.receiveShadow = true;
  lixeira.position.set(-2.4, CALCADA + 0.375, 0.5); scene.add(lixeira);
  const hidrante = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 14), std('#2A2E36', 0.5)); hidrante.castShadow = true;
  hidrante.position.set(2.6, CALCADA + 0.275, 0.4); scene.add(hidrante);

  // o carro (só ao fundo): corpo escuro, cabine, dois faróis e duas lanternas discretas, com o brilho no asfalto à frente
  const carro = new THREE.Group(); scene.add(carro);
  const lataria = std('#0E1116', 0.25, { metalness: 0.6 });
  caixa(4.2, 0.62, 1.75, lataria, 0, 0.55, 0, carro); caixa(2.2, 0.5, 1.6, std('#07090C', 0.15, { metalness: 0.8 }), -0.25, 1.08, 0, carro);
  for (const [x, z] of [[1.3, 0.8], [1.3, -0.8], [-1.3, 0.8], [-1.3, -0.8]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 18), std('#050608', 0.8)); r.rotation.x = Math.PI / 2; r.position.set(x, 0.32, z); carro.add(r); }
  for (const z of [-0.62, 0.62]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF3D8').multiplyScalar(6) })); f.position.set(2.1, 0.62, z); carro.add(f);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), aditivo('#FFF0D0', 0.8)); halo.position.set(2.16, 0.62, z); halo.rotation.y = Math.PI / 2; carro.add(halo);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color('#8E1D1A').multiplyScalar(0.7) })); l.position.set(-2.11, 0.68, z); carro.add(l);
  }
  const facho = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.6), aditivo('#F6E6C4', 0.32)); facho.rotation.x = -Math.PI / 2; facho.position.set(4.6, 0.015, 0); carro.add(facho);

  // a chuva: segmentos curtos inclinados, mais claros dentro do cone do poste (é lá que a gota brilha)
  const pos = new Float32Array(GOTAS * 6), cor = new Float32Array(GOTAS * 6);
  const geoChuva = new THREE.BufferGeometry();
  geoChuva.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geoChuva.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  const chuvaM = new THREE.LineSegments(geoChuva, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
  chuvaM.frustumCulled = false; chuvaM.renderOrder = 4; scene.add(chuvaM);
  const caixaChuva = { x: CHUVA.x, y: 0, w: CHUVA.w, h: CHUVA.h }, AZUL = new THREE.Color('#9FB4DA'), QUENTE = new THREE.Color('#F6DDAE');
  const yLamp = CALCADA + ALTURA_POSTE;

  // contraluz frio e fraco do fim da rua (o céu da cidade): dá o brilho de molhado no asfalto e nas calçadas e recorta
  // os prédios; a luz da cena continua sendo o poste
  const ceu = new THREE.DirectionalLight('#8FA8E0', 0.12); ceu.position.set(-30, 9, -3); scene.add(ceu);
  scene.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.55));
  const pontos = {
    poste: new THREE.Vector3(LAMPADA.x, CALCADA, LAMPADA.z),
    calcada: [new THREE.Vector3(-4, CALCADA, 0.8), new THREE.Vector3(4, CALCADA, 0.8)],
    janelas,
  };
  return {
    scene, pontos, luminaria: L, carro,
    /** chuva 0..1 = parte das gotas visíveis; carro 0..1 = posição do carro (esquerda → direita), fora disso escondido */
    atualizar(t, { chuva = 0, carro: kc = -1 } = {}) {
      const n = Math.round(GOTAS * Math.min(1, Math.max(0, chuva)));
      for (let i = 0; i < n; i++) {
        const [x, yDesce] = gotaDeChuva(i, t, caixaChuva), y = CHUVA.h - yDesce, z = CHUVA.z0 + rnd(i * 3.1 + 0.7) * (CHUVA.z1 - CHUVA.z0);
        const comp = 0.22 + rnd(i + 0.3) * 0.16, o = i * 6;
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + comp * 0.06; pos[o + 4] = y + comp; pos[o + 5] = z;
        // brilho: fraco no escuro, forte dentro do cone (distância ao eixo do poste, abaixo da lâmpada)
        const dx = x - LAMPADA.x, dz = z - LAMPADA.z, raio = 0.35 + 1.0 * (1 - Math.min(1, y / yLamp));
        const dentro = y < yLamp ? Math.exp(-(dx * dx + dz * dz) / (raio * raio)) : 0, k = 0.1 + 1.6 * dentro;
        const c = AZUL.clone().lerp(QUENTE, dentro);
        for (const v of [0, 3]) { cor[o + v] = c.r * k * (v ? 0.25 : 1); cor[o + v + 1] = c.g * k * (v ? 0.25 : 1); cor[o + v + 2] = c.b * k * (v ? 0.25 : 1); }
      }
      geoChuva.setDrawRange(0, n * 2); geoChuva.attributes.position.needsUpdate = true; geoChuva.attributes.color.needsUpdate = true;
      carro.visible = kc >= 0 && kc <= 1;
      carro.position.set(CARRO_X[0] + (CARRO_X[1] - CARRO_X[0]) * Math.min(1, Math.max(0, kc)), 0, PISTA_CARRO);
    },
  };
}
