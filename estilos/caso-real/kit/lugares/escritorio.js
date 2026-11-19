// Escritório aberto à noite: fileiras de mesas com monitores dos dois lados de um corredor central (x = 0, correndo em
// −z), divisórias baixas (1 m) atrás de cada fileira, janelões da cidade no fundo e UMA luminária de teto acesa no meio, com cone.
// As outras luminárias do teto estão apagadas; o resto da luz é o brilho das telas.
//   const O = escritorio({ fileiras, mesasPorFileira }) → { scene, monitores: [], pontos, atualizar(t, { telas, luz, piscar }) }
//   monitores[i]: fileira a fileira (a 0 é a mais perto da entrada, z = 0), da esquerda (−x) para a direita
//   pontos.cadeiras[i]: onde vai a pessoa sentada à mesa i (rotação y = π, de frente para a tela, olhando −z)
//   pontos.lampada: chão debaixo da luminária · pontos.corredor: [entrada, fundo] do corredor, no chão
//   O.atualizar(t, { telas: (i) => opcoesDaTela, luz: 0..1, piscar: 0..1 })   piscar = força do piscaLampada
// Câmera: a luminária fica em z = pontos.lampada.z; seu cone tem 1,35 m de raio no chão — mantenha a câmera fora dele.
import * as THREE from 'three';
import { monitor as criarMonitor } from '../monitor.js';
import { luminaria } from '../luz.js';
import { piscaLampada } from '../ritmo.mjs';
import { rnd } from '../motor/lib.js';
import { mesa, cadeira, teclado, ALTURA_MESA } from './quarto.js';

const PASSO_FILEIRA = 2.5, LARG_MESA = 1.25, PASSO_MESA = 1.35, CORREDOR = 1.5, ALTO = 2.9, I_LAMPADA = 18;
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const caixa = (w, h, d, m, x, y, z, pai) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; o.position.set(x, y, z); pai.add(o); return o; };

/** x das mesas de uma fileira: metade à esquerda do corredor, metade à direita (a sobra vai para a esquerda) */
function xDasMesas(n) {
  const esq = Math.ceil(n / 2), xs = [];
  for (let j = esq - 1; j >= 0; j--) xs.push(-(CORREDOR / 2 + PASSO_MESA / 2 + j * PASSO_MESA));
  for (let j = 0; j < n - esq; j++) xs.push(CORREDOR / 2 + PASSO_MESA / 2 + j * PASSO_MESA);
  return xs;
}

export function escritorio({ fileiras = 3, mesasPorFileira = 4 } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050608'); scene.fog = new THREE.Fog('#050608', 6, 16);
  const xs = xDasMesas(mesasPorFileira), metade = Math.max(...xs.map(Math.abs)) + LARG_MESA / 2 + 1.0;
  const zFim = -(fileiras - 1) * PASSO_FILEIRA - 3.2, zIni = 4.5, prof = zIni - zFim, zMeio = (zIni + zFim) / 2;
  const parede = std('#2B3343', 0.9);
  caixa(2 * metade, 0.1, prof, std('#151A24', 0.85), 0, -0.05, zMeio, scene);                       // carpete
  caixa(2 * metade, 0.1, prof, std('#0E1117', 0.95), 0, ALTO + 0.05, zMeio, scene);
  for (const s of [-1, 1]) caixa(0.1, ALTO, prof, parede, s * (metade + 0.05), ALTO / 2, zMeio, scene);
  caixa(2 * metade, ALTO, 0.1, parede, 0, ALTO / 2, zIni + 0.05, scene);
  // fundo: janelões com a cidade à noite (fria e fraca), em montantes escuros
  const cidade = document.createElement('canvas'); cidade.width = 1024; cidade.height = 256;
  { const g = cidade.getContext('2d'), ceu = g.createLinearGradient(0, 0, 0, 256); ceu.addColorStop(0, '#070B16'); ceu.addColorStop(1, '#16213A'); g.fillStyle = ceu; g.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 26; i++) { const x = i * 40 + rnd(i) * 10, alt = 60 + rnd(i + 7) * 150, larg = 30 + rnd(i + 2) * 20; g.fillStyle = '#05070D'; g.fillRect(x, 256 - alt, larg, alt);
      for (let k = 0; k < 14; k++) if (rnd(i * 31 + k) > 0.72) { g.fillStyle = rnd(k + i) > 0.5 ? 'rgba(241,217,166,0.55)' : 'rgba(150,175,230,0.45)'; g.fillRect(x + 4 + (k % 3) * 9, 256 - alt + 8 + Math.floor(k / 3) * 14, 5, 6); } } }
  const tex = new THREE.CanvasTexture(cidade); tex.colorSpace = THREE.SRGBColorSpace;
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(2 * metade, 1.9), new THREE.MeshBasicMaterial({ map: tex, color: '#9AA6C0', fog: false }));
  vidro.position.set(0, 1.45, zFim - 0.08); scene.add(vidro);
  caixa(2 * metade, 0.5, 0.1, parede, 0, 0.25, zFim - 0.05, scene); caixa(2 * metade, ALTO - 2.4, 0.1, parede, 0, 2.4 + (ALTO - 2.4) / 2, zFim - 0.05, scene);
  const montante = std('#12151C', 0.6);
  for (let x = -metade; x <= metade + 0.01; x += 1.6) caixa(0.08, 1.9, 0.12, montante, x, 1.45, zFim, scene);
  // luminárias apagadas no teto (só a do meio acende)
  const apagada = std('#2A2E36', 0.5);
  for (let r = 0; r < fileiras + 1; r++) for (const x of [-2.6, 0, 2.6]) caixa(1.1, 0.04, 0.5, apagada, x, ALTO - 0.02, 1.6 - r * PASSO_FILEIRA, scene);

  // fileiras: mesa + divisória + monitor + teclado + cadeira
  const divisoria = std('#252A35', 0.95), monitores = [], cadeiras = [];
  for (let r = 0; r < fileiras; r++) {
    const zm = -r * PASSO_FILEIRA;
    for (const s of [-1, 1]) {
      const lado = xs.filter((x) => Math.sign(x) === s); if (!lado.length) continue;
      const x0 = Math.min(...lado) - LARG_MESA / 2, x1 = Math.max(...lado) + LARG_MESA / 2;
      caixa(x1 - x0, 1.0, 0.05, divisoria, (x0 + x1) / 2, 0.5, zm - 0.39, scene);   // baixa (1 m): não esconde a fileira de trás
    }
    xs.forEach((x, j) => {
      const i = monitores.length;
      const m = mesa({ w: LARG_MESA, d: 0.72, cor: '#24262B' }); m.position.set(x, 0, zm); scene.add(m);
      const mon = criarMonitor({ w: 0.56, h: 0.34, seed: i + 1 }); mon.group.position.set(x, ALTURA_MESA, zm - 0.17); scene.add(mon.group); monitores.push(mon);
      const pos = new THREE.Vector3(x, 0, zm + 0.76); cadeiras.push(pos);
      const kb = teclado(); kb.position.set(x, ALTURA_MESA, pos.z - 0.5); scene.add(kb);
      const c = cadeira(); c.position.copy(pos); c.rotation.y = Math.PI + (rnd(i + 5) - 0.5) * 0.5; c.position.z += 0.08 * rnd(i); scene.add(c);
      if (j % 2 === 0) { const p = caixa(0.2, 0.004, 0.28, std('#8E897C', 0.95), x + 0.42, ALTURA_MESA + 0.003, zm + 0.05, scene); p.rotation.y = rnd(i) - 0.5; }
    });
  }
  // armários de arquivo nas paredes laterais
  const arq = std('#1E222B', 0.5, { metalness: 0.3 });
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) caixa(0.5, 1.3, 0.6, arq, s * (metade - 0.3), 0.65, 2.6 - k * 2.2, scene);

  const zLamp = -Math.floor((fileiras - 1) / 2) * PASSO_FILEIRA - (fileiras % 2 ? 0 : PASSO_FILEIRA / 2) + 0.4;
  const L = luminaria(scene, 0, ALTO - 0.05, zLamp, I_LAMPADA);
  const uA = L.cone.material.uniforms.uA.value, discoCor = L.disco.material.color.clone();
  scene.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.3));
  const pontos = { cadeiras, lampada: new THREE.Vector3(0, 0, zLamp), corredor: [new THREE.Vector3(0, 0, zIni - 0.8), new THREE.Vector3(0, 0, zFim + 0.8)] };
  return {
    scene, monitores, pontos, luminaria: L,
    /** telas(i) → opções do desenharTela da mesa i; luz 0..1 = força da luminária; piscar 0..1 = força do defeito */
    atualizar(t, { telas = () => ({}), luz = 1, piscar = 0 } = {}) {
      monitores.forEach((m, i) => m.atualizar(t, telas(i) || {}));
      const f = luz * piscaLampada(t, piscar);
      L.luz.intensity = I_LAMPADA * f; L.cone.material.uniforms.uA.value = uA * f; L.disco.material.color.copy(discoCor).multiplyScalar(0.15 + 0.85 * f);
    },
  };
}
