// Motor "pixel 3D": a cena 3D é renderizada numa grade pequena (270x480 = 1080x1920 / 4), ganha contorno por
// profundidade + normal, tons em degraus (toon) e cores quantizadas com um leve pontilhado; o main.js amplia
// sem suavizar (nearest), então cada pixel vira um bloco 4x4 no vídeo.
//   const E = makePixelEngine(canvas)   ·   E.render(scene, camera, { outline, inner, levels, dither, exposure })
import * as THREE from 'three';

export const PIX = 4, PW = 1080 / PIX, PH = 1920 / PIX;

const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FINAL_FS = `
uniform sampler2D tColor, tNormal, tDepth; uniform vec2 uRes; uniform float uNear, uFar, uOutline, uInner, uLevels, uDither, uExposure;
uniform vec3 uLineTint; varying vec2 vUv;
float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
float D(vec2 o){ return texture2D(tDepth, vUv + o / uRes).r; }
vec3 N(vec2 o){ return texture2D(tNormal, vUv + o / uRes).rgb * 2.0 - 1.0; }
float bayer(vec2 p){ int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int i = x + y * 4;
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0 - 0.5; return 0.0; }
void main(){
  vec4 c = texture2D(tColor, vUv); vec3 col = c.rgb * uExposure;
  float d0 = D(vec2(0.0)); float l0 = lin(d0);
  if (d0 < 0.9999) {
    vec2 o[4]; o[0] = vec2(1.0, 0.0); o[1] = vec2(-1.0, 0.0); o[2] = vec2(0.0, 1.0); o[3] = vec2(0.0, -1.0);
    float outer = 0.0, inner = 0.0; vec3 n0 = N(vec2(0.0));
    for (int k = 0; k < 4; k++) {
      float dn = D(o[k]); float ln = dn > 0.9999 ? 1e4 : lin(dn);
      if (ln - l0 > max(0.06 * l0, 0.05)) outer = 1.0;                    // vizinho bem mais longe: borda de silhueta
      else if (abs(ln - l0) < 0.04 * l0 + 0.03 && dot(n0, N(o[k])) < 0.55) inner = 1.0;   // mesma superfície, dobra
    }
    if (outer > 0.0) col = mix(col, col * 0.18 + uLineTint * 0.06, uOutline);
    else if (inner > 0.0) col = mix(col, col * 0.62, uInner);
  }
  col = clamp(col, 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));                                          // linear -> sRGB
  col = floor(col * uLevels + 0.5 + bayer(gl_FragCoord.xy) * uDither) / uLevels;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export function makePixelEngine(canvas, { w = PW, h = PH, shadow = 512 } = {}) {
  canvas.width = w; canvas.height = h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.userData = { shadow };
  const opts = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter };
  const rtC = new THREE.WebGLRenderTarget(w, h, { ...opts, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(w, h) });
  const rtN = new THREE.WebGLRenderTarget(w, h, opts);
  const normalMat = new THREE.MeshNormalMaterial();
  const quadMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VS, fragmentShader: FINAL_FS, depthTest: false, depthWrite: false,
    uniforms: { tColor: { value: rtC.texture }, tNormal: { value: rtN.texture }, tDepth: { value: rtC.depthTexture }, uRes: { value: new THREE.Vector2(w, h) },
      uNear: { value: 0.1 }, uFar: { value: 100 }, uOutline: { value: 1 }, uInner: { value: 0.6 }, uLevels: { value: 14 }, uDither: { value: 0.5 },
      uExposure: { value: 1 }, uLineTint: { value: new THREE.Color('#1a0f0a') } },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat); quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad); const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const hidden = [];
  return {
    renderer, w, h,
    /** look = { outline 0..1, inner 0..1, levels (cores por canal), dither 0..1, exposure } */
    render(scene, camera, look = {}) {
      renderer.setRenderTarget(rtC); renderer.render(scene, camera);
      // passe de normais: só o que é opaco (ondas, vidro e brilhos não ganham contorno interno)
      hidden.length = 0;
      scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine) { const m = o.material; if (o.visible && (o.userData.noEdge || (m && (m.transparent || m.isPointsMaterial || m.isLineBasicMaterial)))) { o.visible = false; hidden.push(o); } } });
      const bg = scene.background; scene.background = null; scene.overrideMaterial = normalMat;
      renderer.setRenderTarget(rtN); renderer.setClearColor(0x7f7fff, 1); renderer.clear(); renderer.render(scene, camera);
      scene.overrideMaterial = null; scene.background = bg; renderer.setClearColor(0x000000, 1);
      for (const o of hidden) o.visible = true;
      const u = quadMat.uniforms;
      u.uNear.value = camera.near; u.uFar.value = camera.far;
      u.uOutline.value = look.outline ?? 1; u.uInner.value = look.inner ?? 0.6; u.uLevels.value = look.levels ?? 14;
      u.uDither.value = look.dither ?? 0.18; u.uExposure.value = look.exposure ?? 1;
      renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    },
  };
}

// ---- materiais toon (3 degraus de luz, sem gradiente) ----
const RAMP = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export function toon(color, { emissive = '#000000', emissiveIntensity = 1, opacity = 1, side = THREE.FrontSide, map = null } = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: RAMP, emissive, emissiveIntensity, side, map });
  if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
  return m;
}
/** material que brilha sem luz (ondas, telas, luz da cavidade) */
export function glow(color, opacity = 1) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
  return m;
}
/** luz padrão: sol quente com sombra dura + céu/chão */
export function luzes(scene, { sol = '#FFE6C8', solI = 2.4, pos = [4, 7, 5], ceu = '#CFE4FF', chao = '#7A5A44', hemiI = 1.3, caixa = 6, alvo = [0, 0, 0] } = {}) {
  const k = new THREE.DirectionalLight(sol, solI); k.position.set(...pos); k.target.position.set(...alvo); k.castShadow = true;
  k.shadow.mapSize.set(512, 512); k.shadow.bias = -0.002;
  Object.assign(k.shadow.camera, { left: -caixa, right: caixa, top: caixa, bottom: -caixa, near: 0.1, far: 40 }); k.shadow.camera.updateProjectionMatrix();
  const hemi = new THREE.HemisphereLight(ceu, chao, hemiI);
  scene.add(k, k.target, hemi);
  return { sol: k, hemi };
}
export function camera(fov = 35) { return new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.1, 80); }
