// Monitor 3D com a tela viva: moldura escura, tela em CanvasTexture (512×320) desenhada pelo desenharTela do kit e a luz
// da tela (brilhoDeTela) virada para quem está na frente.
//   const M = monitor({ w, h, base, seed })  → { group, tela: { canvas, textura, malha }, atualizar(t, opcoesDaTela), brilho, halo }
//   M.atualizar(t, { linhas, k, cursor, alerta, kAlerta })   redesenha a tela; a textura só sobe quando a chave muda
// O grupo olha para +z. Com base, a origem é o ponto do tampo da mesa debaixo do pé; sem base, é o centro da tela.
// A luz é verde (destaque) com a tela normal e vira vermelha (perigo), mais forte, enquanto o alerta entra.
import * as THREE from 'three';
import { rbox, mesh } from './motor/sdf.js';
import { desenharTela } from './tela.mjs';
import { corDoTema } from './evidencias.mjs';
import { brilhoDeTela } from './luz.js';

export const TELA_PX = [512, 320];
const BRILHO = { normal: 2.4, alerta: 5 }, HALO = 0.1;                 // intensidade da luz da tela
const BORDA = 0.022, FUNDO = 0.035, ALTURA_PE = 0.15;       // moldura, espessura e altura do pescoço (m)
const geos = new Map();
const malha = (chave, f, limites, passo) => { if (!geos.has(chave)) geos.set(chave, mesh(f, limites, passo)); return geos.get(chave); };
const corEntre = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);

export function monitor({ w = 0.62, h = 0.38, base = true, seed = 1 } = {}) {
  const group = new THREE.Group();
  const caixa = new THREE.MeshStandardMaterial({ color: '#15181F', roughness: 0.45, metalness: 0.2 });
  const yTela = base ? ALTURA_PE + h / 2 + BORDA : 0;
  // moldura com cantos arredondados + a corcunda de trás
  const W2 = w / 2 + BORDA, H2 = h / 2 + BORDA;
  const moldura = new THREE.Mesh(malha(`moldura${w}x${h}`, (p) => Math.min(rbox(p, [0, 0, 0], [W2, H2, FUNDO / 2], 0.008), rbox(p, [0, -h * 0.05, -FUNDO], [w * 0.3, h * 0.3, FUNDO * 0.6], 0.02)),
    [[-W2 - 0.01, -H2 - 0.01, -FUNDO * 1.8], [W2 + 0.01, H2 + 0.01, FUNDO / 2 + 0.01]], 0.006), caixa);
  moldura.position.y = yTela; moldura.castShadow = moldura.receiveShadow = true; group.add(moldura);
  if (base) {
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.045, ALTURA_PE + 0.05, 0.03), caixa); pe.position.set(0, (ALTURA_PE + 0.05) / 2, -FUNDO * 0.9);
    const sapata = new THREE.Mesh(malha('sapata', (p) => rbox(p, [0, 0.008, 0], [0.12, 0.008, 0.085], 0.006), [[-0.14, -0.005, -0.1], [0.14, 0.025, 0.1]], 0.005), caixa);
    sapata.position.z = -FUNDO * 0.9; pe.castShadow = sapata.castShadow = true; group.add(pe, sapata);
  }
  // a tela: plano com a textura do canvas, sem luz (MeshBasic) — quem acende é ela
  const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = TELA_PX;
  const g = canvas.getContext('2d'), textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace; textura.anisotropy = 8;
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textura, toneMapped: false }));
  tela.position.set(0, yTela, FUNDO / 2 + 0.001); group.add(tela);
  const verde = corDoTema('destaque'), vermelho = corDoTema('perigo');
  const brilho = brilhoDeTela(group, [0, yTela, FUNDO / 2 + 0.03], verde, BRILHO.normal);
  // o halo: a mesma luz da tela voltando fraca da mesa e do rosto para a parede de trás (sem ele a parede some no preto)
  const halo = new THREE.PointLight(verde, BRILHO.normal * HALO, 1.4, 2); halo.position.set(0, yTela + 0.22, 0.1); group.add(halo);
  let chave = null;
  return {
    group, tela: { canvas, textura, malha: tela }, brilho, halo,
    /** redesenha a tela no instante t (o seed é o do monitor) e acerta a cor/força da luz pelo alerta */
    atualizar(t, o = {}) {
      const nova = desenharTela(g, canvas.width, canvas.height, { seed, ...o, t });
      if (nova !== chave) { chave = nova; textura.needsUpdate = true; }
      const ka = o.alerta && o.alerta !== 'ok' ? Math.min(1, Math.max(0, o.kAlerta ?? 0)) : 0;
      brilho.color.copy(corEntre(verde, vermelho, ka)); halo.color.copy(brilho.color);
      brilho.intensity = BRILHO.normal + (BRILHO.alerta - BRILHO.normal) * ka; halo.intensity = brilho.intensity * HALO;
      return chave;
    },
  };
}
