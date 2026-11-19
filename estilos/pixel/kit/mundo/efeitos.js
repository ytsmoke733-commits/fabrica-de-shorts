// Efeitos do mundo pixel: ondas em arco, vapor, água caindo, fluxo de partículas num caminho e ondas esféricas.
// Começam escondidos ou visíveis conforme a nota de cada um; atualizar(t, ...) é função pura de t.
import * as THREE from 'three';
import { glow, toon } from '../motor/pixel.js';
import { posicaoNoFluxo, raioDaOnda } from './caminhos.mjs';
import { pontoDaGota } from './chuveiro.mjs';

const vec = (p) => (p.isVector3 ? p : new THREE.Vector3(...p));

/** ondas laranja em arco que saem de um ponto (cavidade, cena do corte) */
export function arcos(n = 6) {
  const g = new THREE.Group(), m = glow('#FF9A2E', 0.8), lista = [];
  for (let i = 0; i < n; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 5, 40, Math.PI * 0.8), m.clone()); g.add(a); lista.push(a); }
  return {
    group: g,
    /** origem (Vector3), direção do arco (rotação y), alcance */
    atualizar(t, { origem, rotY = Math.PI, alcance = 2.6, k = 1, vel = 1.3 } = {}) {
      g.visible = k > 0.01;
      lista.forEach((a, i) => {
        const ph = (t * vel + i / n) % 1;
        a.position.copy(origem); a.rotation.set(Math.PI / 2, 0, rotY - Math.PI * 0.4);
        a.scale.setScalar(0.15 + ph * alcance);
        a.material.opacity = 0.85 * (1 - ph) * k;
      });
    },
  };
}

/** vapor: cubinhos brancos subindo (posição base = origem) */
export function vapor(n = 22) {
  const g = new THREE.Group(), m = glow('#FFF6E6', 0.7), lista = [];
  for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), m); g.add(c); lista.push(c); }
  return {
    group: g,
    atualizar(t, k = 1) {
      g.visible = k > 0.01;
      lista.forEach((c, i) => { const ph = (t * 0.45 + i * 0.211) % 1; c.position.set(Math.sin(i * 2.7 + ph * 4) * (0.25 + ph * 0.4), ph * 2.2, Math.cos(i * 1.9) * 0.3); c.scale.setScalar((1 - ph) * 1.6 * k); });
    },
  };
}

/**
 * agua: n gotas e filetes `glow` azul-claro caindo de um crivo (chuveiro, torneira). Um terço são filetes (caixinhas
 * compridas que esticam com a velocidade), o resto gotas. Os furos ficam espalhados num disco de raio `largura`
 * (girassol) e a água abre um pouco ao cair (lógica pura: pontoDaGota em chuveiro.mjs). Nada acumula: cada quadro
 * recalcula todas as gotas a partir de t. Medidas em metros (tamanho 0,009 = 9 mm).
 * .atualizar(t, { origem ([x, y, z] ou Vector3, centro do crivo), k = 1 (vazão: quantas gotas aparecem; 0 esconde),
 *                 largura = 0.08 (raio do crivo), altura = 2 (queda até o chão), vel = 1.3 (ciclos por segundo) })
 * Começa visível; esconda no reset (`a.group.visible = false`) ou chame atualizar com k = 0.
 */
export function agua(n = 60, { cor = '#8FD0FF', tamanho = 0.009 } = {}) {
  const g = new THREE.Group(), m = glow(cor), geo = new THREE.BoxGeometry(1, 1, 1), lista = [];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(geo, m); c.userData.noEdge = true; c.userData.filete = i % 3 === 0;
    g.add(c); lista.push(c);
  }
  return {
    group: g, gotas: lista,
    atualizar(t, { origem = [0, 0, 0], k = 1, largura = 0.08, altura = 2, vel = 1.3 } = {}) {
      g.visible = k > 0.01;
      if (!g.visible) return;
      const o = vec(origem), vis = Math.round(n * Math.min(1, k));
      lista.forEach((c, i) => {
        // as gotas que somem com a vazão baixa são as de fora do crivo (o centro é o último a secar)
        c.visible = i < vis;
        if (!c.visible) return;
        const p = pontoDaGota(i, n, t, { raio: largura, altura, vel });
        c.position.set(o.x + p.x, o.y + p.y, o.z + p.z);
        const e = Math.min(1, p.fase / 0.05, (1 - p.fase) / 0.06);       // nasce no furo e some no chão sem saltar
        const s = tamanho * Math.max(e, 0.02);
        const comp = c.userData.filete ? 4 + 9 * p.fase : 1.6;          // filete estica com a velocidade
        c.scale.set(s, s * comp, s);
      });
    },
  };
}

/**
 * gradiente(cores) -> função u -> cor, para o `cores` do fluxo (u em [0, 1]).
 *   gradiente(['#FF8A2E', '#4FA3FF', '#FF8A2E'])          cores igualmente espaçadas no caminho
 *   gradiente([[0, '#FF5A2E'], [0.8, '#4F8BFF'], [0.9, '#FF5A2E'], [1, '#FF5A2E']])   paradas em u
 * Entre duas cores a mistura é em RGB: laranja -> azul passa por um roxo apagado; para uma virada seca (o gás que
 * esquenta de repente no compressor) ponha as duas paradas bem perto. Repita a 1ª cor no fim num caminho fechado.
 */
export function gradiente(lista) {
  const pa = lista.map((e, i) => (Array.isArray(e) ? [e[0], new THREE.Color(e[1])] : [lista.length > 1 ? i / (lista.length - 1) : 0, new THREE.Color(e)]));
  const out = new THREE.Color();
  return (u) => {
    if (u <= pa[0][0]) return out.copy(pa[0][1]);
    for (let i = 1; i < pa.length; i++) {
      if (u <= pa[i][0]) { const [u0, c0] = pa[i - 1], [u1, c1] = pa[i]; return out.copy(c0).lerp(c1, u1 > u0 ? (u - u0) / (u1 - u0) : 1); }
    }
    return out.copy(pa[pa.length - 1][1]);
  };
}

/**
 * fluxo: n bolinhas `glow` correndo por uma CatmullRomCurve3 que passa por `pontos` ([x, y, z] ou Vector3).
 *   fechado (padrão): o caminho fecha e as bolinhas dão a volta.
 *   aberto (fechado: false): com repetir (padrão) cada bolinha some no fim e reentra no começo (encolhe perto das
 *   pontas, sem salto); com repetir: false elas passam uma vez só e saem de cena (posicaoNoFluxo devolve null).
 *   vel = voltas por segundo (o caminho inteiro leva 1 / vel s).  tubo: { cor, raio, opacidade } desenha um cano
 *   transparente (sem contorno) ao longo do caminho, com as bolinhas visíveis dentro.
 * .atualizar(t, { k, cores }): k 0..1 (tamanho e visibilidade); cores = função u -> cor (ex.: gradiente([...])).
 * Começa visível; esconda no reset (`f.group.visible = false`) ou chame atualizar com k = 0.
 */
export function fluxo(pontos, n = 16, { cor = '#FFB43A', raio = 0.08, vel = 0.2, fechado = true, repetir = true, tubo = null } = {}) {
  const g = new THREE.Group();
  const curva = new THREE.CatmullRomCurve3(pontos.map((p) => vec(p).clone()), fechado, 'centripetal');
  const geo = new THREE.SphereGeometry(raio, 10, 8), lista = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(geo, glow(cor)); g.add(s); lista.push(s); }
  let cano = null;
  if (tubo) {
    const op = tubo.opacidade ?? 0.3;
    cano = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(64, pontos.length * 24), tubo.raio ?? raio * 1.8, 10, fechado), toon(tubo.cor ?? '#E8D9C0', { opacity: op }));
    cano.userData.opacidade = op; g.add(cano);
  }
  const ciclico = fechado || repetir;
  return {
    group: g, curva, bolinhas: lista, cano,
    atualizar(t, { k = 1, cores = null } = {}) {
      g.visible = k > 0.01;
      if (cano) cano.material.opacity = cano.userData.opacidade * Math.min(1, k);
      lista.forEach((s, i) => {
        const u = posicaoNoFluxo(i, n, t, vel, ciclico);
        if (u === null) { s.visible = false; return; }
        s.visible = true;
        curva.getPointAt(u, s.position);
        const e = fechado ? k : k * Math.min(1, u / 0.06, (1 - u) / 0.06);
        s.scale.setScalar(Math.max(e, 1e-3));
        s.material.color.set(cores ? cores(u) : cor);
      });
    },
  };
}

/** shader das ondas: guarda a posição no mundo e multiplica o alfa pelo fator do outro lado do plano (uniforms do material) */
function paredeNaOnda(sh, renderer) {
  sh.uniforms.uPlanoOnda = this.userData.uPlano; sh.uniforms.uFatorOnda = this.userData.uFator;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundoOnda;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvMundoOnda = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundoOnda;\nuniform vec4 uPlanoOnda;\nuniform float uFatorOnda;')
    .replace('#include <opaque_fragment>', '#include <opaque_fragment>\nif (dot(uPlanoOnda.xyz, vMundoOnda) + uPlanoOnda.w > 0.0) gl_FragColor.a *= uFatorOnda;');
}

/**
 * ondasEsfericas: n cascas esféricas `glow` transparentes (sem contorno) que crescem de uma origem até o alcance e
 * somem (alfa cai com o raio). Cada casca tem um aro mais forte na silhueta (o círculo onde a esfera tangencia a
 * visão da câmera, recalculado em cada render), para a frente da onda ler contra parede clara. Atravessam paredes:
 * o que fica atrás de uma parede opaca é escondido pela profundidade, então a onda "passa" pela parede.
 * Opções: cor, opacidade (do miolo da casca), aro (opacidade do aro), espessura (do aro, fração do raio; 0,05 padrão,
 * ~0,1 numa vista de cima longe, onde o aro fino some contra o piso), corte (espessura, fração do raio, do círculo
 * onde cada casca corta um plano horizontal; ex.: 0,012; null = sem corte).
 * .atualizar(t, { origem ([x, y, z] ou Vector3), alcance = 6, vel = 0.45 (ciclos por segundo), k = 1, parede = null, corteY = null })
 *   parede = { ponto, normal, fator }: do outro lado do plano (o lado para onde `normal` aponta) a onda fica com a
 *   opacidade x fator (ex.: fatorDaParede(perdaNaParede(2.4)) ~ 0,5): "perde força" ao atravessar a parede. Por pixel
 *   (posição no mundo, no shader); sem parede (null) nada muda.
 *   corteY = altura (mundo) do plano do corte (tampo de mesa, chão): a frente da onda passando por ele vira um círculo
 *   (raio √(r² - dy²)) com a opacidade do aro. É o que aparece num close perto da casca, onde o aro (silhueta) fica em
 *   volta da própria câmera. Precisa da opção corte.
 * Começa visível; esconda no reset (`o.group.visible = false`) ou chame atualizar com k = 0.
 */
export function ondasEsfericas(n = 4, { cor = '#FFB43A', opacidade = 0.22, aro = 0.85, espessura = 0.05, corte = null } = {}) {
  const g = new THREE.Group(), geo = new THREE.SphereGeometry(1, 32, 20), geoAro = new THREE.RingGeometry(1 - espessura, 1, 64), lista = [];
  const cw = new THREE.Vector3(), ow = new THREE.Vector3();
  const uPlano = { value: new THREE.Vector4(0, 0, 0, -1) }, uFator = { value: 1 };   // n·p + d > 0 = do outro lado
  const comParede = (m) => { m.onBeforeCompile = paredeNaOnda; m.userData.uPlano = uPlano; m.userData.uFator = uFator; return m; };
  const geoCorte = corte ? new THREE.RingGeometry(1 - corte, 1, 96) : null;
  for (let j = 0; j < n; j++) {
    const s = new THREE.Mesh(geo, comParede(glow(cor, 0.5))), a = new THREE.Mesh(geoAro, comParede(glow(cor, 0.5)));
    // aro na silhueta: a esfera de raio r vista de longe D tangencia num círculo de raio r·√(1 - r²/D²), a r²/D do centro
    a.onBeforeRender = (renderer, scene, cam) => {
      cam.getWorldPosition(cw); s.getWorldPosition(ow);
      const r = s.scale.x, D = cw.distanceTo(ow);
      if (r >= D * 0.995) { a.scale.setScalar(1e-4); a.updateMatrixWorld(); return; }   // câmera dentro da casca: sem aro
      const p = ow.clone().lerp(cw, (r * r) / (D * D));
      a.position.copy(g.worldToLocal(p)); a.lookAt(cw); a.scale.setScalar(r * Math.sqrt(1 - (r * r) / (D * D))); a.updateMatrixWorld();
    };
    // o aro só vai para o lugar certo no onBeforeRender, que roda DEPOIS do teste de frustum: sem isto, com a origem do
    // mundo fora do quadro (vista de cima), o aro é descartado parado na origem e nunca aparece
    a.frustumCulled = false;
    let c = null;
    if (geoCorte) { c = new THREE.Mesh(geoCorte, comParede(glow(cor, 0.5))); c.rotation.x = -Math.PI / 2; c.visible = false; g.add(c); }
    g.add(s, a); lista.push({ s, a, c });
  }
  return {
    group: g, cascas: lista.map((c) => c.s),
    atualizar(t, { origem = [0, 0, 0], alcance = 6, vel = 0.45, k = 1, parede = null, corteY = null } = {}) {
      g.visible = k > 0.01;
      const o = vec(origem);
      if (parede) {
        const nn = vec(parede.normal).clone().normalize();
        uPlano.value.set(nn.x, nn.y, nn.z, -nn.dot(vec(parede.ponto))); uFator.value = parede.fator ?? 0.5;
      } else { uPlano.value.set(0, 0, 0, -1); uFator.value = 1; }
      lista.forEach(({ s, a, c }, j) => {
        const { r, alfa } = raioDaOnda(j, n, t, vel, alcance);
        s.position.copy(o); s.scale.setScalar(Math.max(r, 1e-3));
        s.material.opacity = opacidade * alfa * k; s.visible = s.material.opacity > 0.004;
        a.material.opacity = aro * alfa * k; a.visible = a.material.opacity > 0.004;   // independente do miolo (miolo fraco, aro forte)
        if (c) {
          const dy = corteY === null ? Infinity : corteY - o.y, rc = r * r - dy * dy;
          c.visible = a.visible && rc > 1e-6;
          if (c.visible) { c.position.set(o.x, corteY, o.z); c.scale.setScalar(Math.sqrt(rc)); c.material.opacity = a.material.opacity; }
        }
      });
    },
  };
}
