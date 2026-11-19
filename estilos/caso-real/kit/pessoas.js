// Pessoas sem rosto do caso-real (portes de NF/src/core/sets3d.js): o Human do kit (personagem/humano.js) com face: false,
// todo num material só. Três jeitos de aparecer, e só um é vermelho cheio:
//   materialTestemunha()      quase preto com a borda vermelha (fresnel): quem estava lá
//   materialAlvo(i)           vermelho brasa aceso com volume (emissive por N·V, faz bloom): a pessoa do caso / o ataque
//   materialMemoria()         o shader da testemunha em vermelho fraco, transparente (0,45): lembrança, quem já não está
//                             (a pessoa('memoria') ganha uma pré-passada só de profundidade: o fantasma mostra só a pele
//                             da frente, sem as juntas e os ossos de dentro aparecendo um através do outro)
//   pessoa(tipo, opcoes)      new Human({ ...opcoes, face: false }) + setAllMaterial; tipo 'testemunha' | 'alvo' | 'memoria'
//   POSES_CASO                poses de corpo no formato do POSES_CORPO, para h.posar(POSES_CASO.x, k)
//   digitar(h, t, k)          dedos no teclado: soma digitacaoNoTempo(t) nos cotovelos e punhos (chame depois do posar)
// Nunca chama face(): a pessoa sem rosto não tem boca nem olhos. Cores do tema: alvo (borda e brilho) e brasa (memória).
import * as THREE from 'three';
import { Human } from './personagem/humano.js';
import { POSES_CORPO } from './personagem/poses.mjs';
import { digitacaoNoTempo } from './ritmo.mjs';
import { corDoTema } from './evidencias.mjs';

const D = THREE.MathUtils.degToRad;
const BASE_ESCURA = '#07080B';
const PRONACAO = 90, FLEXAO = 18;   // graus: palma para baixo e dedos caindo no teclado (digitar)

// fresnel: base escura + borda na cor uRim; uA = opacidade (a memória é a mesma coisa, transparente)
const VERT = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
const FRAG = 'uniform vec3 uRim, uBase; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0); gl_FragColor = vec4(uBase + uRim * f * 2.2, uA); }';
function fresnel(borda, base, a) {
  return new THREE.ShaderMaterial({
    uniforms: { uRim: { value: new THREE.Color(borda) }, uBase: { value: new THREE.Color(base) }, uA: { value: a } },
    vertexShader: VERT, fragmentShader: FRAG, transparent: a < 1, depthWrite: a >= 1,
  });
}

/** testemunha: corpo quase preto com a borda vermelha do tema (alvo) */
export const materialTestemunha = () => fresnel(corDoTema('alvo'), BASE_ESCURA, 1);
/**
 * a pessoa do caso: vermelho brasa aceso, com volume. É um MeshStandardMaterial no tom do `alvo` (a luz da cena modela
 * cabeça e ombros) cujo emissive (i = intensidade) varia com N·V: 60% no centro do corpo (de frente para a câmera),
 * 100% nas bordas, mais uma borda um pouco mais quente (alvo puxado para laranja). Sem isso o emissive constante virava
 * uma mancha salmão chapada nos closes.
 */
export const VOLUME_ALVO = { centro: 0.6, borda: 0.35 };
export function materialAlvo(i = 2.2) {
  const alvo = new THREE.Color(corDoTema('alvo'));
  const m = new THREE.MeshStandardMaterial({ color: alvo.clone().multiplyScalar(0.55), emissive: alvo, emissiveIntensity: i, roughness: 0.5 });
  const quente = alvo.clone().lerp(new THREE.Color('#FFB27A'), 0.45);
  m.userData.volume = { uCentro: { value: VOLUME_ALVO.centro }, uBorda: { value: VOLUME_ALVO.borda }, uQuente: { value: quente } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.volume);
    sh.uniforms.emissiveIntensityAlvo = { get value() { return m.emissiveIntensity; } };   // lido a cada quadro
    sh.fragmentShader = 'uniform float uCentro, uBorda, emissiveIntensityAlvo; uniform vec3 uQuente;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float nvAlvo = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), frAlvo = 1.0 - nvAlvo;
      totalEmissiveRadiance = totalEmissiveRadiance * mix(uCentro, 1.0, frAlvo * frAlvo) + uQuente * emissiveIntensityAlvo * uBorda * pow(frAlvo, 3.0);`);
  };
  m.customProgramCacheKey = () => 'alvo-volume';
  return m;
}
/** memória: o shader da testemunha com a borda em brasa e o corpo num vermelho bem escuro, a 45% de opacidade */
export const materialMemoria = () => fresnel(corDoTema('brasa'), new THREE.Color(corDoTema('brasa')).multiplyScalar(0.35), 0.45);

const MATERIAIS = { testemunha: materialTestemunha, alvo: () => materialAlvo(), memoria: materialMemoria };

/** pessoa sem rosto do tipo dado; `opcoes` vão para o Human (cores não importam: o material cobre tudo) */
export function pessoa(tipo = 'testemunha', opcoes = {}) {
  const material = MATERIAIS[tipo];
  if (!material) throw new Error(`pessoa "${tipo}" não existe (use testemunha, alvo ou memoria)`);
  const h = new Human({ ...opcoes, face: false });
  h.setAllMaterial(material());
  if (tipo === 'memoria') prepassDeProfundidade(h);
  return h;
}

// Pré-passada da memória: cada parte ganha uma cópia invisível (colorWrite false) que só escreve profundidade, na fila
// dos transparentes antes da cor (renderOrder 1 → 2). Assim a cena opaca atrás já está desenhada, e o fantasma pinta só
// a superfície mais próxima, uma vez.
const SO_PROFUNDIDADE = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true });
function prepassDeProfundidade(h) {
  for (const p of h.parts) {
    const d = new THREE.Mesh(p.geometry, SO_PROFUNDIDADE); d.renderOrder = 1; d.castShadow = false; d.receiveShadow = false;
    p.add(d); p.renderOrder = 2;
  }
}

// Sentado: o hipsY 0,53 do POSES_CORPO.sentado do kit (o 0,66 do NF era do Human antigo) põe a coxa num assento de
// 0,43 m e os pés no chão; as mesas do kit têm o tampo a 0,74 m e o teclado a ~0,46 m à frente do quadril.
const SENTADO = { hipsY: 0.53, hipL: [88, 0, 2], hipR: [88, 0, 2], knL: 88, knR: 88 };
export const POSES_CASO = {
  // curvado para a tela, braços à frente e antebraços quase na horizontal, mãos no teclado
  sentadoDigitando: { ...SENTADO, spine: [10, 0, 0], head: [6, 0, 0], shL: [40, 0, 2], shR: [40, 0, 2], elL: 70, elR: 70 },
  // encostado, cabeça erguida para a tela, mãos paradas na beira da mesa
  sentadoOlhando: { ...SENTADO, spine: [-4, 0, 0], head: [-6, 0, 0], shL: [30, 0, 10], shR: [30, 0, 10], elL: 64, elR: 64 },
  // em pé, parado, cabeça um pouco erguida (olhando a luz / a tela)
  emPeOlhando: { ...POSES_CORPO.emPe, head: [-8, 0, 0], spine: [0, 0, 0], shL: [2, 0, 5], shR: [2, 0, 5], elL: 8, elR: 8 },
  // igual a em pé: quem vira de costas é o grupo (h.group.rotation.y)
  deCostas: { ...POSES_CORPO.emPe },
  // braços cruzados na frente do peito: antebraços na horizontal, um por cima do outro
  bracosCruzados: { ...POSES_CORPO.emPe, head: [-2, 0, 0], shL: [10, 70, 4], shR: [14, -70, 10], elL: 95, elR: 100 },
};

/**
 * mãos no teclado: vira a palma para baixo (pronação de 90° no punho), deixa os dedos caírem um pouco (flexão de 18°) e soma
 * o ritmo de digitacaoNoTempo(t) nos cotovelos (dobra) e na flexão dos punhos. Tudo escala com k (0 = a pose como veio).
 * Chame depois do posar (o pose() zera os punhos).
 */
export function digitar(h, t, k = 1) {
  const d = digitacaoNoTempo(t), ritmo = { L: [d.elL, d.punhoL], R: [d.elR, d.punhoR] };
  for (const lado of ['L', 'R']) {
    const a = h.arm[lado], [el, punho] = ritmo[lado];
    a.el.rotation.x -= D(el * k);
    a.hand.rotation.y += D(-a.s * PRONACAO * k);
    a.hand.rotation.z += D(-a.s * (FLEXAO + punho) * k);
  }
  h.group.updateMatrixWorld(true);
  return h;
}
