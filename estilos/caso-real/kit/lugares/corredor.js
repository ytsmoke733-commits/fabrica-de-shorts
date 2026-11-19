// Corredor comprido de prédio (porte do corridor() de NF/src/core/sets3d.js): portas dos dois lados, paredes, teto e a
// porta do fim; duas luminárias de teto com cone, como no NF — a da frente firme (a luz da cena) e a do fundo com defeito,
// piscando pelo piscaLampada. O corredor corre em −z a partir de z ≈ 3; a porta do fim fica em z −18,9.
//   const C = corredor() → { scene, pontos, luminarias: [frente, fundo], atualizar(t, { piscar }) }
//   pontos.lampadas: [chão debaixo da da frente, chão debaixo da do fundo] · pontos.fundo: chão diante da porta do fim
//   pontos.entrada: chão no começo do corredor
//   C.atualizar(t, { piscar: 0..1 })   força do defeito na luminária do fundo (0 = firme; o padrão 1 é o NF)
// Câmera: os cones têm 1,35 m de raio no chão em pontos.lampadas — mantenha a câmera fora deles.
import * as THREE from 'three';
import { luminaria } from '../luz.js';
import { piscaLampada } from '../ritmo.mjs';

const I = { frente: 22, fundo: 9 }, Z = { frente: -4.5, fundo: -11.5 }, ALTO = 3;
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const caixa = (w, h, d, m, x, y, z, pai) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; o.position.set(x, y, z); pai.add(o); return o; };

export function corredor() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050608'); scene.fog = new THREE.Fog('#050608', 4, 16);
  const parede = std('#3A4258', 0.85), piso = std('#262B36', 0.55), porta = std('#3A3330', 0.6), batente = std('#1B1E26', 0.7);
  caixa(3, 0.1, 22, piso, 0, -0.05, -8, scene);
  caixa(0.1, ALTO, 22, parede, -1.5, ALTO / 2, -8, scene); caixa(0.1, ALTO, 22, parede, 1.5, ALTO / 2, -8, scene);
  caixa(3, 0.1, 22, std('#1A1E28'), 0, ALTO, -8, scene); caixa(3, ALTO, 0.1, parede, 0, ALTO / 2, -19, scene);
  // rodapé escuro dos dois lados (dá a linha de fuga no chão)
  const rodape = std('#16191F', 0.6);
  for (const s of [-1, 1]) caixa(0.03, 0.1, 22, rodape, s * 1.435, 0.05, -8, scene);
  // 5 portas de cada lado, desencontradas, com batente, maçaneta e a plaquinha do número
  const macaneta = std('#B89A5E', 0.3, { metalness: 0.8 }), placa = std('#8A7A5A', 0.35, { metalness: 0.7 });
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const z = -1 - i * 3.4 - (s > 0 ? 1.7 : 0);
    caixa(0.06, 2.1, 0.95, porta, s * 1.44, 1.05, z, scene); caixa(0.08, 2.25, 1.1, batente, s * 1.47, 1.1, z, scene);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), macaneta); k.position.set(s * 1.39, 1.0, z + 0.35); scene.add(k);
    caixa(0.012, 0.08, 0.14, placa, s * 1.405, 1.65, z, scene);
  }
  caixa(0.95, 2.1, 0.06, porta, 0, 1.05, -18.94, scene);                      // a porta do fim
  caixa(1.1, 2.25, 0.04, batente, 0, 1.1, -18.97, scene);

  const frente = luminaria(scene, 0, 2.95, Z.frente, I.frente), fundo = luminaria(scene, 0, 2.95, Z.fundo, I.fundo);
  const uA = fundo.cone.material.uniforms.uA.value, discoCor = fundo.disco.material.color.clone();
  scene.add(new THREE.HemisphereLight('#4A5A80', '#0A0C12', 1.1));     // o NF usava 0,7: com 1,1 as portas e as paredes ainda leem
  const pontos = {
    lampadas: [new THREE.Vector3(0, 0, Z.frente), new THREE.Vector3(0, 0, Z.fundo)],
    fundo: new THREE.Vector3(0, 0, -17.6), entrada: new THREE.Vector3(0, 0, 1.5),
  };
  return {
    scene, pontos, luminarias: [frente, fundo],
    /** piscar 0..1 = força do defeito da luminária do fundo (luz, cone e disco caem juntos) */
    atualizar(t, { piscar = 1 } = {}) {
      const f = piscaLampada(t, piscar);
      fundo.luz.intensity = I.fundo * f; fundo.cone.material.uniforms.uA.value = uA * f;
      fundo.disco.material.color.copy(discoCor).multiplyScalar(0.15 + 0.85 * f);
    },
  };
}
