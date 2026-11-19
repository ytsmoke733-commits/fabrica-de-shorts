// A parede do caso (porte do caseWall() de NF/src/core/sets3d.js): quadro de cortiça 4 × 5,2 m numa parede escura, as
// fotos presas com alfinetes vermelhos, duas fichas de anotação presas com fita e o barbante vermelho ligando as fotos.
// A luz da cena é UMA SpotLight quente vinda da frente e do alto (a mesma do NF). O quadro fica em z = 0, olhando +z.
//   const P = paredeDoCaso(fotos) → { scene, pinos, atualizar(t, { barbante }) }
//   fotos = canvases (ex.: polaroid desenhada num canvas próprio, gerada UMA vez fora do quadro); 5 fotos, ciclando
//   pinos[i] = posição (Vector3) do alfinete da foto i
//   P.atualizar(t, { barbante: 0..1 })   revela os fios em ordem (trechoDoFio), cada um crescendo do 1º alfinete ao 2º
import * as THREE from 'three';
import { trechoDoFio } from '../ritmo.mjs';
import { corDoTema } from '../evidencias.mjs';
import { rnd } from '../motor/lib.js';

const PINOS = [[-1.0, 1.4], [0.9, 1.6], [0.0, 0.2], [-1.1, -1.2], [1.0, -1.0]];
const FIOS = [[0, 2], [2, 4], [1, 2], [2, 3], [0, 1]];                 // ordem em que o barbante entra
const SEGMENTOS = 20, RADIAIS = 6;
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
function texturaCanvas(w, h, desenho) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function paredeDoCaso(fotos) {
  if (!fotos?.length) throw new Error('paredeDoCaso: passe ao menos 1 foto (canvas)');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0A0806');

  // cortiça com grão determinístico (o NF usava Math.random), moldura de madeira e a parede escura em volta
  const cortica = texturaCanvas(512, 512, (c) => {
    c.fillStyle = '#5A3F2A'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${rnd(i) > 0.5 ? '20,10,5' : '140,100,60'},${rnd(i + 0.37) * 0.25})`; c.fillRect(rnd(i + 0.11) * 512, rnd(i + 0.73) * 512, 2, 2); }
  });
  cortica.wrapS = cortica.wrapT = THREE.RepeatWrapping; cortica.repeat.set(3, 4);
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(4, 5.2), std('#ffffff', 0.95, { map: cortica })); quadro.receiveShadow = true; scene.add(quadro);
  const madeira = std('#2A1C12', 0.6);
  for (const [w, h, x, y] of [[4.24, 0.12, 0, 2.66], [4.24, 0.12, 0, -2.66], [0.12, 5.44, -2.06, 0], [0.12, 5.44, 2.06, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), madeira); m.position.set(x, y, 0.02); m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  const parede = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std('#1A1612', 0.95)); parede.position.z = -0.03; parede.receiveShadow = true; scene.add(parede);

  // as fotos, cada uma com o alfinete vermelho em cima
  const corPino = corDoTema('alvo'), pinos = [];
  PINOS.forEach(([x, y], i) => {
    const tex = new THREE.CanvasTexture(fotos[i % fotos.length]); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const foto = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.05), std('#ffffff', 0.6, { map: tex }));
    foto.position.set(x, y - 0.42, 0.02 + i * 0.002); foto.rotation.z = (i % 2 ? 1 : -1) * 0.06; foto.castShadow = true; scene.add(foto);
    const pino = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), std(corPino, 0.3)); pino.position.set(x, y, 0.06); pino.castShadow = true; scene.add(pino);
    pinos.push(pino.position.clone());
  });

  // duas fichas de anotação (linhas datilografadas, ilegíveis de propósito) presas com fita
  const ficha = texturaCanvas(300, 200, (c, w, h) => {
    c.fillStyle = corDoTema('papel'); c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(70,90,130,0.5)'; c.fillRect(0, 34, w, 2);
    c.fillStyle = 'rgba(40,36,30,0.75)'; for (let i = 0; i < 5; i++) c.fillRect(18, 52 + i * 26, 160 + rnd(i + 3) * 100, 8);
  });
  const fita = std(corDoTema('fita'), 0.7, { transparent: true, opacity: 0.85 });
  [[-0.95, -0.05, -0.05], [0.1, 1.2, 0.06]].forEach(([x, y, r], i) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), std('#ffffff', 0.85, { map: ficha })); f.position.set(x, y, 0.015 + i * 0.001); f.rotation.z = r; f.castShadow = true; scene.add(f);
    const tira = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.08), fita); tira.position.set(x + Math.sin(-r) * 0.25, y + Math.cos(r) * 0.25, 0.03); tira.rotation.z = r + 0.1; scene.add(tira);
  });

  // o barbante: cada fio é um tubo numa curva que cede um pouco no meio; drawRange revela do 1º alfinete para o 2º
  const corFio = new THREE.Color(corDoTema('alvo')).multiplyScalar(0.85);
  const fioM = new THREE.MeshStandardMaterial({ color: corFio, roughness: 0.6, emissive: corDoTema('brasa'), emissiveIntensity: 0.6 });
  const fios = FIOS.map(([a, b]) => {
    const A = new THREE.Vector3(PINOS[a][0], PINOS[a][1], 0.07), B = new THREE.Vector3(PINOS[b][0], PINOS[b][1], 0.07), meio = A.clone().lerp(B, 0.5);
    meio.z = 0.1; meio.y -= 0.08;
    const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, meio, B), SEGMENTOS, 0.012, RADIAIS);
    const m = new THREE.Mesh(g, fioM); m.castShadow = true; scene.add(m); return g;
  });

  const s = new THREE.SpotLight('#F6DDAE', 30, 10, 0.45, 0.6, 1.3); s.position.set(0.6, 1.4, 4); s.target.position.set(0, 0.2, 0);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0003; scene.add(s, s.target);
  scene.add(new THREE.HemisphereLight('#3A2A20', '#000000', 0.25));
  return {
    scene, pinos, luz: s,
    /** barbante 0..1: os fios aparecem em ordem; função pura do parâmetro (o drawRange é refeito a cada chamada) */
    atualizar(t, { barbante = 1 } = {}) {
      fios.forEach((g, j) => {
        const k = trechoDoFio(j, fios.length, barbante);
        g.setDrawRange(0, Math.round(k * SEGMENTOS) * RADIAIS * 6);   // o índice do TubeGeometry anda segmento a segmento
      });
    },
  };
}
