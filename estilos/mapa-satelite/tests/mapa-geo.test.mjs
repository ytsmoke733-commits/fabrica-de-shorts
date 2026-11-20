import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merc, lonlat, cam, geoTela, daTela, enquadrar, voo, roteiroDeCamera, velocidadeZoom, pesosLOD, distanciaKm, medirRota, pontoNaRota, suavizar, cobre, TELA } from '../kit/mapa/geo.mjs';

const BH = [-43.94, -19.92], SP = [-46.63, -23.55];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≉ ${b} (±${tol})`);

test('merc e lonlat são inversos', () => {
  for (const [lon, lat] of [BH, SP, [0, 0], [120, 60]]) {
    const [lo, la] = lonlat(...merc(lon, lat));
    perto(lo, lon, 1e-9); perto(la, lat, 1e-9);
  }
});

test('o centro da câmera cai no centro da tela; geoTela e daTela são inversos', () => {
  const c = cam(...BH, 50);
  const [px, py] = geoTela(c, ...BH);
  perto(px, TELA.W / 2, 1e-6); perto(py, TELA.H / 2, 1e-6);
  const [x, y] = daTela(c, 100, 300);
  const [qx, qy] = geoTela(c, ...lonlat(x, y));
  perto(qx, 100, 1e-6); perto(qy, 300, 1e-6);
});

test('norte fica para cima na tela', () => {
  const c = cam(...BH, 500);
  assert.ok(geoTela(c, BH[0], BH[1] + 0.1)[1] < TELA.H / 2);
});

test('distanciaKm: BH–SP dá cerca de 490 km', () => {
  perto(distanciaKm(BH, SP), 490, 15);
});

test('enquadrar deixa todos os pontos dentro da tela, com margem', () => {
  const c = enquadrar([BH, SP], { margem: 0.1 });
  for (const p of [BH, SP]) {
    const [x, y] = geoTela(c, ...p);
    assert.ok(x >= 0.1 * TELA.W - 1 && x <= 0.9 * TELA.W + 1 && y >= 0.1 * TELA.H - 1 && y <= 0.9 * TELA.H + 1, `${p} fora: ${x}, ${y}`);
  }
});

test('voo começa na câmera de partida, termina na de chegada e interpola o zoom em escala log', () => {
  const a = cam(...SP, 4000), b = cam(...BH, 40);
  for (const [k, c] of [[0, a], [1, b]]) {
    const v = voo(k, a, b);
    perto(v.x, c.x, 1e-3); perto(v.y, c.y, 1e-3); perto(v.mpp, c.mpp, 1e-9);
  }
  perto(voo(0.5, a, b).mpp, Math.sqrt(4000 * 40), 1e-6, 'meio do voo = média geométrica');
});

test('voo com arco afasta no meio do caminho', () => {
  const a = cam(...SP, 40), b = cam(...BH, 40);
  assert.ok(voo(0.5, a, b, { arco: 3 }).mpp > 40 * 2.9);
});

test('roteiroDeCamera segura as pontas e velocidadeZoom é negativa ao aproximar', () => {
  const a = cam(...BH, 1000), b = cam(...BH, 10);
  const f = roteiroDeCamera([[1, a], [2, b]]);
  assert.equal(f(0).mpp, 1000); assert.equal(f(3).mpp, 10);
  assert.ok(velocidadeZoom(f, 1.5) < 0);
  perto(velocidadeZoom(f, 2.5), 0, 1e-9);
});

test('pesosLOD: a camada mais grossa vale sempre 1; a fina só entra quando a vista chega perto da resolução dela', () => {
  const camadas = [{ mpp: 500 }, { mpp: 10 }];
  assert.deepEqual(pesosLOD(camadas, 2000), [1, 0]);
  assert.deepEqual(pesosLOD(camadas, 10), [1, 1]);
  const meio = pesosLOD(camadas, 30)[1];
  assert.ok(meio > 0 && meio < 1);
});

test('medirRota e pontoNaRota: ponta no início, no fim e no meio do comprimento', () => {
  const rota = medirRota([SP, BH]);
  perto(rota.km, distanciaKm(SP, BH), 1e-9);
  const ini = pontoNaRota(rota, 0), fim = pontoNaRota(rota, 1), meio = pontoNaRota(rota, 0.5);
  perto(ini.x, rota.xy[0][0], 1e-6); perto(fim.y, rota.xy[1][1], 1e-6);
  perto(meio.x, (rota.xy[0][0] + rota.xy[1][0]) / 2, 1e-3);
});

test('suavizar passa pelos pontos dados e termina no último', () => {
  const pts = [[-44, -20], [-43.9, -19.95], [-43.85, -19.9], [-43.8, -19.92]];
  const s = suavizar(pts, 8);
  assert.equal(s.length, (pts.length - 1) * 8 + 1);
  assert.deepEqual(s[s.length - 1], pts[pts.length - 1]);
  for (let i = 0; i < pts.length - 1; i++) { perto(s[i * 8][0], pts[i][0], 1e-9); perto(s[i * 8][1], pts[i][1], 1e-9); }
});

test('cobre: uma camada grande cobre a vista; uma pequena não', () => {
  const c = cam(...BH, 20);
  const [x, y] = merc(...BH);
  assert.equal(cobre(c, [x - 1e6, y - 1e6, x + 1e6, y + 1e6]), true);
  assert.equal(cobre(c, [x - 100, y - 100, x + 100, y + 100]), false);
});
