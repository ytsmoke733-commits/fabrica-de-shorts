// Luz dos lugares escuros do caso-real (portes de NF/src/core/sets3d.js e do NIGHT de NF/src/shots.js). Regra do estilo:
// UMA luz por cena (luminária de teto OU a tela do computador), o resto escuro.
//   NOITE                                          o look do E.render para lugar escuro (espalhe e sobrescreva: { ...NOITE, focus })
//   cone(h, r, cor, a)                             cone de luz visível (volume falso, aditivo) com o ápice em (0, 0, 0), apontando para baixo
//   luminaria(scene, x, y, z, I, { cone })         luminária de teto: SpotLight quente com sombra + disco aceso + cone → { luz, cone }
//   brilhoDeTela(pai, pos, cor, I, frente)         luz da tela: SpotLight suave na cor da tela, virada para a frente dela
// O vendor não traz o RectAreaLightUniformsLib (sem ele a RectAreaLight não acende), então a luz da tela é uma SpotLight
// larga e sem sombra, saindo do centro da tela: ilumina só o que está na frente (rosto, mãos, mesa), nunca a parede de trás.
import * as THREE from 'three';

export const NOITE = { exposure: 1.25, bloom: 0.85, bloomThreshold: 0.55, vignette: 0.6, grain: 0.05, warm: 0 };

/** cone de luz visível (o lightCone do NF): mais forte no eixo e apagando até a base; não escreve profundidade */
export function cone(h = 2.6, r = 1.1, cor = '#F1D9A6', a = 0.12) {
  const g = new THREE.ConeGeometry(r, h, 48, 1, true); g.translate(0, -h / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(cor) }, uA: { value: a }, uH: { value: h } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uH; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = abs(dot(normalize(vN), normalize(vV))); float fade = 1.0 + vY / uH; gl_FragColor = vec4(uC * uA * e * e * fade, 1.0); }',
  });
  const c = new THREE.Mesh(g, m); c.renderOrder = 3; return c;
}

/** luminária de teto em (x, y, z) mirando o chão logo abaixo (o lamp do NF). I = intensidade da SpotLight */
export function luminaria(scene, x, y, z, I = 18, { cone: comCone = true } = {}) {
  const luz = new THREE.SpotLight('#F6DDAE', I, 10, 0.85, 0.6, 1.3);
  luz.position.set(x, y, z); luz.target.position.set(x, 0, z);
  luz.castShadow = true; luz.shadow.mapSize.set(2048, 2048); luz.shadow.bias = -0.0003; luz.shadow.radius = 4;
  scene.add(luz, luz.target);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 32), new THREE.MeshBasicMaterial({ color: '#FFF0CF' }));
  disco.position.set(x, y + 0.02, z); scene.add(disco);
  let c = null;
  if (comCone) { c = cone(y, 1.35); c.position.set(x, y, z); scene.add(c); }
  return { luz, cone: c, disco };
}

/**
 * luz da tela: SpotLight larga (≈70°), sem sombra, na cor da tela, em `pos` no espaço de `pai` (a cena ou o grupo do
 * monitor, para andar junto com ele) e virada para `frente` (padrão +z local). A distância curta (3,5 m) deixa a luz
 * morrer no quarto: é a tela que acende o rosto, não a sala.
 */
export function brilhoDeTela(pai, pos, cor = '#3CFF7A', I = 2, frente = [0, 0, 1]) {
  const luz = new THREE.SpotLight(cor, I, 3.5, 1.2, 1, 2);
  luz.position.set(...pos); luz.target.position.set(pos[0] + frente[0], pos[1] + frente[1], pos[2] + frente[2]);
  pai.add(luz, luz.target);
  return luz;
}
