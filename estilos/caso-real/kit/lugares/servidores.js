// Sala de servidores à noite: um corredor (x = 0, correndo em −z) entre duas fileiras de racks altos com as portas de
// grade viradas para ele, piso elevado escuro e molhado de reflexo (roughness 0,3), bandejas de cabo no alto.
// A luz da cena é UMA luminária com cone no meio do corredor; no fim, a porta de saída com o visor frio deixa entrar uma
// luz fria e fraca. Os LEDs dos servidores (verdes, ~70% acesos, mudando 8×/s) são detalhe, não luz.
//   const S = servidores({ racks }) → { scene, pontos, atualizar(t, { alarme }) }
//   racks = racks por fileira (2 fileiras); pontos.corredor: [entrada, fundo] no chão · pontos.lampada: chão debaixo da
//   luminária · pontos.leds: centro do painel de LEDs do rack da esquerda mais perto da luz (para o close)
//   S.atualizar(t, { alarme: 0..1 })   com alarme, uma parte dos LEDs vira vermelha e pisca (estadoDoLed do ritmo)
// Câmera: o cone da luminária tem 1,35 m de raio no chão em pontos.lampada — mantenha a câmera fora dele.
import * as THREE from 'three';
import { luminaria } from '../luz.js';
import { estadoDoLed } from '../ritmo.mjs';
import { corDoTema } from '../evidencias.mjs';

const RACK = { w: 0.6, d: 1.05, h: 2.1, folga: 0.02 }, CORREDOR = 1.3, ALTO = 3.0, UNIDADES = 10, I_LAMPADA = 20;
const LEDS_POR_UNIDADE = 4;                         // 3 juntos na ponta da gaveta + 1 sozinho na outra
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const caixa = (w, h, d, m, x, y, z, pai) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; o.position.set(x, y, z); pai.add(o); return o; };
function texturaCanvas(w, h, desenho, repetir = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetir); }
  return t;
}

/** frente do rack: porta de grade com 10 gavetas (servidores), alças e furos de ventilação */
let texFrente = null;
function frenteDoRack() {
  return (texFrente ??= texturaCanvas(256, 896, (g, w, h) => {
    g.fillStyle = '#121419'; g.fillRect(0, 0, w, h);
    const alt = (h - 40) / UNIDADES;
    for (let u = 0; u < UNIDADES; u++) {
      const y = 20 + u * alt;
      g.fillStyle = u % 3 === 2 ? '#2A2F39' : '#22262E'; g.fillRect(14, y + 3, w - 28, alt - 6);
      g.fillStyle = '#0A0B0F';
      for (let k = 0; k < 9; k++) for (let r = 0; r < 4; r++) g.fillRect(40 + k * 18, y + 14 + r * 14, 9, 6);      // ventilação
      g.fillStyle = '#4A505C'; g.fillRect(18, y + 10, 8, alt - 20); g.fillRect(w - 26, y + 10, 8, alt - 20);    // alças
      g.fillStyle = '#05060A'; g.fillRect(w - 64, y + alt / 2 - 6, 30, 12);                                    // baia dos LEDs
    }
    g.strokeStyle = '#22262F'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);                            // moldura da porta
  }));
}
/** piso elevado: placas de 60 cm com junta escura; algumas perfuradas (as do corredor frio) */
function pisoElevado() {
  return texturaCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#5A6070'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2A2E38'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h);
    g.fillStyle = '#3E434F'; for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) if ((i + j) % 2 === 0) g.fillRect(14 + i * 17, 14 + j * 17, 5, 5);
  }, [1, 1]);
}

export function servidores({ racks = 6 } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#040507'); scene.fog = new THREE.Fog('#040507', 5, 15);
  const passo = RACK.w + RACK.folga, comp = racks * passo;
  const zIni = 0, zFim = -comp - 2.2, zFundo = 3.2, xParede = CORREDOR / 2 + RACK.d + 0.7;
  const zDoRack = (k) => zIni - RACK.w / 2 - k * passo;

  // piso elevado (placas de 0,6 m), paredes e teto escuros
  const texPiso = pisoElevado(); texPiso.repeat.set(2 * xParede / 0.6, (zFundo - zFim) / 0.6);
  caixa(2 * xParede, 0.1, zFundo - zFim, std('#1A1E26', 0.3, { map: texPiso, metalness: 0.15 }), 0, -0.05, (zFundo + zFim) / 2, scene);
  const parede = std('#1C222E', 0.9);
  for (const s of [-1, 1]) caixa(0.1, ALTO, zFundo - zFim, parede, s * (xParede + 0.05), ALTO / 2, (zFundo + zFim) / 2, scene);
  caixa(2 * xParede, ALTO, 0.1, parede, 0, ALTO / 2, zFundo + 0.05, scene);
  caixa(2 * xParede, 0.1, zFundo - zFim, std('#0B0D12', 0.95), 0, ALTO + 0.05, (zFundo + zFim) / 2, scene);

  // fundo: parede com a porta de saída; o visor deixa passar a luz fria e fraca do corredor de fora
  caixa(2 * xParede, ALTO, 0.1, parede, 0, ALTO / 2, zFim - 0.05, scene);
  caixa(0.95, 2.1, 0.05, std('#2A2F3A', 0.5, { metalness: 0.4 }), 0, 1.05, zFim + 0.02, scene);
  caixa(1.07, 2.17, 0.06, std('#12151B', 0.6), 0, 1.085, zFim + 0.005, scene);
  const fria = new THREE.Color('#8FB0F0');
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.5), new THREE.MeshBasicMaterial({ color: fria.clone().multiplyScalar(0.3) }));
  visor.position.set(0, 1.5, zFim + 0.052); scene.add(visor);
  caixa(0.95, 0.03, 0.06, std('#2A2F3A', 0.4, { metalness: 0.6 }), 0, 1.0, zFim + 0.07, scene);                // barra antipânico
  const luzFria = new THREE.SpotLight(fria, 1.2, 7, 0.6, 1, 1.6); luzFria.position.set(0, 1.9, zFim + 0.3); luzFria.target.position.set(0, 0, zFim + 1.6);
  scene.add(luzFria, luzFria.target);

  // as duas fileiras de racks: a porta de grade virada para o corredor, laterais e topo em aço escuro
  const aco = std('#14171D', 0.55, { metalness: 0.4 }), frente = std('#FFFFFF', 0.65, { map: frenteDoRack(), metalness: 0.15 });
  const leds = [];                                   // [x, y, z] de cada LED, fileira a fileira, rack a rack, gaveta a gaveta
  for (const s of [-1, 1]) {
    const xc = s * (CORREDOR / 2 + RACK.d / 2), xFace = s * CORREDOR / 2;
    for (let k = 0; k < racks; k++) {
      const z = zDoRack(k), mats = [aco, aco, aco, aco, aco, aco]; mats[s < 0 ? 0 : 1] = frente;
      caixa(RACK.d, RACK.h, RACK.w, mats, xc, RACK.h / 2, z, scene);
      caixa(RACK.d + 0.02, 0.06, RACK.w + 0.01, std('#0B0D11', 0.6), xc, 0.03, z, scene);                // rodapé
      const alt = (RACK.h - 0.094) / UNIDADES;
      for (let u = 0; u < UNIDADES; u++) {
        const y = RACK.h - 0.047 - (u + 0.5) * alt, sz = -s;                 // z local cresce da esquerda para a direita de quem olha
        const zBaia = z + sz * (RACK.w / 2 - 0.13);                         // a baia dos LEDs, perto da alça
        for (let l = 0; l < 3; l++) leds.push([xFace - s * 0.006, y, zBaia - sz * l * 0.022]);
        leds.push([xFace - s * 0.006, y - alt * 0.22, z - sz * (RACK.w / 2 - 0.1)]);
      }
    }
    // bandeja de cabos por cima da fileira, com cabos escuros
    caixa(0.5, 0.06, comp + 0.3, std('#1E232C', 0.5, { metalness: 0.5 }), s * (CORREDOR / 2 + 0.3), RACK.h + 0.35, zIni - comp / 2, scene);
    for (let c = 0; c < 4; c++) caixa(0.04, 0.04, comp + 0.3, std(['#0D1016', '#151A22'][c % 2], 0.7), s * (CORREDOR / 2 + 0.14 + c * 0.1), RACK.h + 0.4, zIni - comp / 2, scene);
  }
  // fim das fileiras: tampa lateral e um gabinete baixo de energia
  for (const s of [-1, 1]) caixa(0.6, 1.1, 0.8, std('#191C23', 0.6, { metalness: 0.3 }), s * (CORREDOR / 2 + 0.35), 0.55, zDoRack(racks - 1) - RACK.w / 2 - 0.9, scene);

  // LEDs: um InstancedMesh só; a cor de cada um é refeita a cada quadro (verde / apagado / vermelho do alarme)
  const geoLed = new THREE.BoxGeometry(0.004, 0.008, 0.008);
  const malhaLeds = new THREE.InstancedMesh(geoLed, new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), leds.length);
  const m4 = new THREE.Matrix4();
  leds.forEach(([x, y, z], i) => { malhaLeds.setMatrixAt(i, m4.makeTranslation(x, y, z)); malhaLeds.setColorAt(i, new THREE.Color()); });
  malhaLeds.instanceMatrix.needsUpdate = true; scene.add(malhaLeds);
  const COR = {
    verde: new THREE.Color(corDoTema('destaque')).multiplyScalar(1.6),
    vermelho: new THREE.Color(corDoTema('perigo')).multiplyScalar(5),
    apagado: new THREE.Color('#0A1A10'),
  };

  const zMeio = zIni - comp / 2;
  const L = luminaria(scene, 0, ALTO - 0.05, zMeio, I_LAMPADA);
  scene.add(new THREE.HemisphereLight('#24324F', '#05070C', 0.35));
  const pontos = {
    corredor: [new THREE.Vector3(0, 0, zIni + 1.6), new THREE.Vector3(0, 0, zFim + 0.8)],
    lampada: new THREE.Vector3(0, 0, zMeio),
    leds: new THREE.Vector3(-CORREDOR / 2, RACK.h * 0.55, zDoRack(Math.max(0, Math.floor(racks / 2) - 1))),
  };
  return {
    scene, pontos, luminaria: L, leds: malhaLeds,
    /** alarme 0..1: a parte dos LEDs que vira vermelha e pisca cresce com ele (0 = só verdes) */
    atualizar(t, { alarme = 0 } = {}) {
      for (let i = 0; i < leds.length; i++) malhaLeds.setColorAt(i, COR[estadoDoLed(i, t, alarme)]);
      malhaLeds.instanceColor.needsUpdate = true;
    },
  };
}
