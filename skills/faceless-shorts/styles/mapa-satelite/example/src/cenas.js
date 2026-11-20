// "45 anos esperando 10 km de metrô" (Marca A, voxel com mapa de satélite, ~50-60 s). O satélite real é o palco o tempo
// todo: Brasil → Minas acende → mergulho até BH, e depois a câmera nunca para sobre a cidade enquanto a Linha 1 (verde) e a
// Linha 2 (dourada / tracejada) contam a história, com cartões cartoon por cima e o ano no canto.
// Uma cena por linha falada; TODOS os instantes saem de tempo.linha(i) / tempo.palavra('…', i) (realinha com a voz nova).
// O estado do mapa (linhas desenhadas, câmera) é função do t do filme, igual em qualquer cena: o corte não pula nada.
// Todo quadro = função pura de t. Nada de 3D aqui (as cenas não chamam blit).
import { ctx, seg, eo, eio, clamp } from '../kit/motor/lib.js';
import { cartaoFinal } from '../kit/hud.mjs';
import { merc, cam, enquadrar, roteiroDeCamera, velocidadeZoom, medirRota, pontoNaRota, paraTela, lonlat } from '../kit/mapa/geo.mjs';
import { veiculo, ano, rodape } from '../kit/mapa/mapa.js';
import { L1_86, L1_leste, L2, BARREIRO, EST } from './linhas.js';
import { carimbo, cartaoPlano, documento, barraObras, cartaoAnuncio, cartaoLeilao, martelo, graficoCem, estacaoVazia, OURO, VERDE, VERMELHO, AZUL } from './objetos.js';

const MG_CAIXA = [[-51.05, -22.9], [-39.85, -14.25]];
const BH = [-43.938, -19.919];
const ANOS = [null, '1981', '1986', '1998', '2004', '2011', '2022', '2022', '2024', '2028?', '2028?'];
const OURO_APAGADO = '#C9A24A', CINZA = '#D8DEE6';

/** câmera que põe (lon, lat) no pixel (sx, sy) da tela com mpp */
function noPixel([lon, lat], mpp, sx = 540, sy = 960) {
  const [x, y] = merc(lon, lat);
  return { x: x - (sx - 540) * mpp, y: y + (sy - 960) * mpp, mpp };
}

/** trilha suave por chaves [[t, câmera]]: Hermite com tangentes Catmull-Rom (não uniformes) em x, y e ln(mpp).
 *  A velocidade é contínua nas chaves (a câmera não para nelas); depois da última chave segue na última tangente. */
function trilha(chaves) {
  const T = chaves.map((c) => c[0]), P = chaves.map(([, c]) => [c.x, c.y, Math.log(c.mpp)]), n = T.length;
  const M = P.map((p, i) => { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); return p.map((_, k) => (P[b][k] - P[a][k]) / (T[b] - T[a])); });
  const sai = (v) => ({ x: v[0], y: v[1], mpp: Math.exp(v[2]) });
  return (t) => {
    if (t <= T[0]) return sai(P[0].map((v, k) => v + M[0][k] * (t - T[0])));
    if (t >= T[n - 1]) return sai(P[n - 1].map((v, k) => v + M[n - 1][k] * (t - T[n - 1])));
    let i = 1; while (T[i] < t) i++;
    const h = T[i] - T[i - 1], s = (t - T[i - 1]) / h, s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return sai(P[i].map((_, k) => h00 * P[i - 1][k] + h10 * h * M[i - 1][k] + h01 * P[i][k] + h11 * h * M[i][k]));
  };
}

/** fração (0..1 do comprimento na tela) do ponto da rota mais perto de [lon, lat] */
function fracaoNaRota(pontos, alvo) {
  const r = medirRota(pontos), [ax, ay] = merc(...alvo);
  let melhor = [Infinity, 0];
  for (let i = 1; i < r.xy.length; i++) {
    const [x0, y0] = r.xy[i - 1], [x1, y1] = r.xy[i], dx = x1 - x0, dy = y1 - y0;
    const u = clamp(((ax - x0) * dx + (ay - y0) * dy) / (dx * dx + dy * dy || 1));
    const d = Math.hypot(x0 + u * dx - ax, y0 + u * dy - ay);
    if (d < melhor[0]) melhor = [d, (r.acc[i - 1] + u * (r.acc[i] - r.acc[i - 1])) / r.total];
  }
  return melhor[1];
}

export function montarCenas(E, { tempo, script, mapa }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cenaEm = (at, id, note, draw, gain = 0.35) => { cenas.push({ id, at, note, draw }); cue(at, 'whoosh', { gain }); };
  const W = (txt, i, n = 1) => tempo.palavra(txt, i, n);
  const fim = (i) => tempo.fimLinha(i);
  const g = ctx;
  const creditos = `${mapa.creditos}; traçados: © OpenStreetMap`;

  // ── geometria da Linha 2 ──────────────────────────────────────────────
  const R2 = medirRota(L2), fNS = fracaoNaRota(L2, EST['Nova Suíça']), fAM = fracaoNaRota(L2, EST.Amazonas);
  const F40 = 0.4, P40 = lonlat(...(() => { const p = pontoNaRota(R2, F40); return [p.x, p.y]; })());
  const KM2 = (Math.round(R2.km * 2) / 2).toLocaleString('pt-BR');               // ~10,5 km (do traçado)
  const MEIO_L2 = lonlat(...(() => { const p = pontoNaRota(R2, 0.5); return [p.x, p.y]; })());

  // ── câmera: abertura (Brasil → MG → mergulho) e depois trilha contínua sobre a cidade ──
  const tMG = W('anos', 0), tPor = W('por', 0), tA = inicio(1);
  const BR = cam(-48.5, -16.6, 3000 * Math.exp(-0.07 * tPor));           // abre em mpp ~3000: a vista fica dentro da camada brasil
  const MGc = enquadrar(MG_CAIXA, { margem: 0.06, deslocar: [0, -0.03] });
  const MGc2 = { ...noPixel([-44.6, -18.9], MGc.mpp * 0.86, 540, 900) };
  const C0 = noPixel([-43.993, -19.947], 13.5, 540, 900);
  const voosAbertura = roteiroDeCamera([[0, BR], [tMG, MGc], [tPor, MGc2], [tA, C0]]);
  const abertura = (t) => { const c = voosAbertura(t); return t < tPor ? { ...c, mpp: c.mpp * Math.exp(-0.07 * (t - tPor)) } : c; };
  const cidade = trilha([
    [tA, C0],
    [fim(1) + 0.1, noPixel([-43.993, -19.947], 11.5, 540, 900)],
    [fim(2) + 0.1, noPixel([-43.986, -19.941], 12.2, 540, 900)],
    [fim(3) + 0.1, noPixel([-43.982, -19.934], 10.2, 540, 960)],
    [fim(4) + 0.1, noPixel([(EST.Calafate[0] + P40[0]) / 2, (EST.Calafate[1] + P40[1]) / 2], 9.6, 540, 960)],
    [fim(5) + 0.1, noPixel([-43.972, -19.925], 14.0, 540, 1000)],
    [fim(6) + 0.1, noPixel([-43.978, -19.930], 12.8, 540, 1000)],
    [fim(7) + 0.1, noPixel([-43.980, -19.929], 11.2, 540, 980)],
    [fim(8) + 0.1, noPixel([(EST['Nova Suíça'][0] + EST.Amazonas[0]) / 2, (EST['Nova Suíça'][1] + EST.Amazonas[1]) / 2], 9.2, 540, 940)],
    [(fim(8) + fim(9)) / 2 + 0.2, noPixel(MEIO_L2, 10.6, 540, 1000)],
    [fim(9) + 0.1, noPixel(BARREIRO, 9.2, 720, 1200)],                   // Barreiro à direita: a placa fica à esquerda, longe da linha
    [tempo.duracao, noPixel(BARREIRO, 10.2, 720, 1200)],
  ]);
  const camera = (t) => (t < tA ? abertura(t) : cidade(t));
  const tela = (c, p) => paraTela(c, ...merc(...p));

  // ── estado do mapa em função de t (o mesmo em qualquer cena) ──────────
  const kPlano = (t) => eio(seg(t, W('linha', 1), W('Barreiro', 1) + 0.15));
  const alfaPlano = (t) => 1 - 0.5 * eo(seg(t, W('Barreiro', 2), W('Barreiro', 2) + 0.5)) + 0.35 * eo(seg(t, inicio(9), inicio(9) + 0.6));
  const kL1 = (t) => eio(seg(t, W('metrô', 2), W('um', 2) + 0.1));
  const kL1leste = (t) => eio(seg(t, inicio(5) + 0.2, inicio(5) + 1.6));
  const kObra = (t) => (t < inicio(4) ? 0.03 * eo(seg(t, W('começaram', 3), fim(3))) : 0.03 + (F40 - 0.03) * eio(seg(t, inicio(4) + 0.1, W('feitos', 4) + 0.2)));
  const parada = (t) => eo(seg(t, W('pararam', 4), W('pararam', 4) + 0.4)) * (1 - eo(seg(t, W('voltaram', 8), W('voltaram', 8) + 0.5)));
  const kAberta = (t) => eio(seg(t, W('abriram', 8), W('abriram', 8) + 0.7));

  function linhas(c, t) {
    const pl = kPlano(t);
    if (pl > 0) mapa.rota(g, c, L2, pl, { cor: CINZA, largura: 6, brilho: 10, nucleo: false, tracejado: [16, 14], fase: t > inicio(9) ? t * 40 : 0, alfa: alfaPlano(t) });
    const lest = kL1leste(t);
    if (lest > 0) mapa.rota(g, c, L1_leste, lest, { cor: VERDE, largura: 6, brilho: 14, nucleo: false, alfa: 0.75 });
    const l1 = kL1(t);
    if (l1 > 0) mapa.rota(g, c, L1_86, l1, { cor: VERDE, largura: 8, brilho: 24 });
    const ob = kObra(t), ab = kAberta(t), apaga = Math.max(parada(t), ab);   // obra parada / depois da abertura: o resto da obra fica apagado
    if (ob > 0) mapa.rota(g, c, L2, ob, { cor: apaga > 0 ? OURO_APAGADO : OURO, largura: 9 - 2 * ab, brilho: 20 * (1 - 0.6 * apaga), nucleo: apaga < 0.5 });
    if (ab > 0) mapa.rota(g, c, L2, fAM * ab, { cor: '#FFE27A', largura: 13, brilho: 42 });
    return { pl, l1, ob, ab };
  }

  /** ano: troca do ano da linha anterior para o desta linha no corte; extra = troca dentro da linha */
  function anoDaLinha(t, i) {
    const de = ANOS[i - 1], para = ANOS[i];
    if (!para) return;
    if (de === para) { ano(g, para, 1); return; }
    const k = eo(seg(t, inicio(i), inicio(i) + 0.4));
    if (de) ano(g, de, 1 - k);
    ano(g, para, k);
  }
  // obturador: 0,25 no alto; perto da cidade (mpp 150 → 40) cai para 0,06, e o desfoque radial some antes de virar "degraus"
  const obturador = (mpp) => 0.06 + 0.19 * clamp(Math.log(mpp / 40) / Math.log(150 / 40));
  const base = (t) => { const c = camera(t); mapa.desenhar(g, c, { desfoque: velocidadeZoom(camera, t), obturador: obturador(c.mpp) }); return c; };
  const topo = (t, i, kc = 1) => { rodape(g, creditos, { k: kc }); if (i != null) anoDaLinha(t, i); };

  // ══ L0 · Brasil → Minas acende → mergulho até BH ═════════════════════
  cenaEm(0, 'L0', 'satélite: Brasil (relevo) → Minas Gerais acende → mergulho com desfoque até BH', (lt, d, t) => {
    const c = base(t);
    const kMG = eo(seg(t, W('espera', 0) - 0.1, W('anos', 0))) * (1 - seg(t, tPor, tPor + 0.35));
    mapa.realce(g, c, 'MG', kMG, { escurecer: 0.45 });
    mapa.rotulo(g, c, -45.2, -17.0, 'Minas Gerais', { k: eo(seg(t, W('há', 0), W('anos', 0))) * (1 - seg(t, tPor, tPor + 0.3)), tamanho: 46, ponto: false, lado: 'acima' });
    mapa.marcador(g, c, ...BH, { k: eo(seg(t, W('anos', 0), W('anos', 0) + 0.3)) * (1 - seg(t, tPor + 0.5, tPor + 0.9)), t, raio: 10 });
    mapa.rotulo(g, c, ...BH, 'Belo Horizonte', { k: eo(seg(t, W('anos', 0) + 0.1, W('anos', 0) + 0.5)) * (1 - seg(t, tPor + 0.3, tPor + 0.6)), tamanho: 38, lado: 'direita', ponto: false });
    linhas(c, t);
    topo(t, null, eo(seg(t, 0.3, 0.9)));
  }, 0);
  cue(W('espera', 0) - 0.1, 'sparkle', { dur: 0.8, gain: 0.45 });
  cue(tPor, 'whoosh', { gain: 0.8 });

  // ══ L1 · 1981: o plano já tinha a linha até o Barreiro ═══════════════
  cenaEm(inicio(1), 'L1', '1981: cartão do plano; Linha 2 tracejada se desenha de Calafate ao Barreiro', (lt, d, t) => {
    const c = base(t);
    const { pl } = linhas(c, t);
    mapa.marcador(g, c, ...EST.Calafate, { k: eo(seg(t, W('linha', 1) - 0.2, W('linha', 1) + 0.1)), t, raio: 8 });
    mapa.rotulo(g, c, ...EST.Calafate, 'Calafate', { k: eo(seg(t, W('linha', 1) - 0.1, W('linha', 1) + 0.3)), tamanho: 32, ponto: false, lado: 'direita' });
    mapa.marcador(g, c, ...BARREIRO, { k: eo(seg(t, W('Barreiro', 1) - 0.05, W('Barreiro', 1) + 0.25)), t, raio: 9 });
    mapa.rotulo(g, c, ...BARREIRO, 'Barreiro', { k: eo(seg(t, W('Barreiro', 1), W('Barreiro', 1) + 0.35)), tamanho: 38, ponto: false, lado: 'abaixo' });
    mapa.rotulo(g, c, ...MEIO_L2, `${KM2} km`, { k: eo(seg(t, W('Barreiro', 1) + 0.2, W('Barreiro', 1) + 0.6)) * (pl > 0.99 ? 1 : 0), tamanho: 36, ponto: false, lado: 'direita', cor: CINZA });
    cartaoPlano(g, 540, 430, { k: seg(t, W('plano', 1) - 0.1, W('plano', 1) + 0.35), kMeta: seg(t, W('pronta', 1), W('pronta', 1) + 0.35) });
    topo(t, 1);
  });
  cue(W('plano', 1), 'pop', { gain: 0.6 });
  cue(W('linha', 1), 'slide', { gain: 0.4 });
  cue(W('pronta', 1), 'pop', { gain: 0.5 });

  // ══ L2 · 1986: só a Linha 1 abre; o Barreiro fica pra depois ═════════
  cenaEm(inicio(2), 'L2', '1986: Linha 1 verde neon se desenha Eldorado → Lagoinha com trem; a Linha 2 tracejada apaga', (lt, d, t) => {
    const c = base(t);
    const { l1 } = linhas(c, t);
    const ponta = mapa.rota(g, c, L1_86, l1, { alfa: 0 });
    mapa.rotulo(g, c, ...EST.Eldorado, 'Eldorado', { k: eo(seg(t, W('metrô', 2) - 0.1, W('metrô', 2) + 0.3)), tamanho: 32, lado: 'abaixo' });
    mapa.rotulo(g, c, ...EST.Lagoinha, 'Lagoinha', { k: eo(seg(t, W('um', 2) - 0.1, W('um', 2) + 0.3)), tamanho: 32, lado: 'acima' });
    mapa.rotulo(g, c, -43.968, -19.912, 'LINHA 1', { k: eo(seg(t, W('Linha', 2), W('Linha', 2) + 0.3)), tamanho: 40, ponto: false, lado: 'acima', cor: VERDE, peso: 900 });
    veiculo(g, ponta.x, ponta.y, ponta.ang, { tipo: 'trem', escala: 1.25, k: eo(seg(t, W('metrô', 2), W('metrô', 2) + 0.3)) * (1 - seg(t, W('Barreiro', 2) - 0.2, W('Barreiro', 2) + 0.1)) });
    mapa.marcador(g, c, ...BARREIRO, { k: 1 - 0.5 * seg(t, W('Barreiro', 2), W('Barreiro', 2) + 0.5), t, raio: 9, cor: CINZA });
    mapa.rotulo(g, c, ...BARREIRO, 'Barreiro', { k: 1, tamanho: 38, ponto: false, lado: 'abaixo', cor: CINZA });
    carimbo(g, 540, 420, 'FICA PRA DEPOIS', { k: seg(t, W('depois', 2) - 0.25, W('depois', 2) + 0.05), cor: '#FFFFFF', tam: 64, rot: -0.08, fundo: 'rgba(11,18,32,0.55)' });
    topo(t, 2);
  });
  cue(W('metrô', 2), 'slide', { gain: 0.5 });
  cue(W('depois', 2), 'thud', { gain: 0.6 });

  // ══ L3 · 1998: Banco Mundial, obras começam ══════════════════════════
  cenaEm(inicio(3), 'L3', '1998: documento de empréstimo com carimbo BANCO MUNDIAL; a Linha 2 dourada começa em Calafate', (lt, d, t) => {
    const c = base(t);
    const { ob } = linhas(c, t);
    const ponta = mapa.rota(g, c, L2, Math.max(ob, 1e-4), { alfa: 0 });
    mapa.marcador(g, c, ponta.lon, ponta.lat, { k: eo(seg(t, W('começaram', 3) - 0.2, W('começaram', 3) + 0.2)), t, cor: OURO, raio: 10 });
    mapa.rotulo(g, c, ...EST.Calafate, 'Calafate', { k: 1, tamanho: 32, ponto: false, lado: 'direita' });
    documento(g, 540, 470, { k: seg(t, W('empréstimo', 3) - 0.1, W('empréstimo', 3) + 0.35) * (1 - seg(t, W('começaram', 3) + 0.2, W('começaram', 3) + 0.5)) });
    carimbo(g, 560, 500, 'BANCO MUNDIAL', { k: seg(t, W('Mundial', 3) - 0.2, W('Mundial', 3) + 0.05) * (1 - seg(t, W('começaram', 3) + 0.2, W('começaram', 3) + 0.5)), cor: AZUL, tam: 60, rot: -0.16 });
    topo(t, 3);
  });
  cue(W('empréstimo', 3), 'pop', { gain: 0.5 });
  cue(W('Mundial', 3), 'thud', { gain: 0.8 });
  cue(W('começaram', 3), 'zip', { gain: 0.5 });

  // ══ L4 · 2004: 40% e parou ═══════════════════════════════════════════
  cenaEm(inicio(4), 'L4', '2004: dourado cresce até 40% com barra de obras; carimbo PAROU no fim do trecho; faltou verba', (lt, d, t) => {
    const c = base(t);
    const { ob } = linhas(c, t);
    const [px, py] = tela(c, P40);
    mapa.marcador(g, c, ...P40, { k: seg(t, W('feitos', 4), W('feitos', 4) + 0.3), t, cor: VERMELHO, raio: 10 });
    barraObras(g, 540, 400, ob, { k: seg(t, inicio(4), inicio(4) + 0.35), parou: eo(seg(t, W('pararam', 4), W('pararam', 4) + 0.3)) });
    carimbo(g, px + 20, py - 120, 'PAROU', { k: seg(t, W('pararam', 4) - 0.2, W('pararam', 4) + 0.05), tam: 84, rot: -0.2 });
    carimbo(g, 540, 560, 'FALTOU VERBA', { k: seg(t, W('verba', 4) - 0.25, W('verba', 4) + 0.05), tam: 48, rot: 0.05, fundo: 'rgba(255,244,220,0.92)' });
    topo(t, 4);
  });
  cue(inicio(4) + 0.1, 'zip', { gain: 0.5 });
  cue(W('pararam', 4), 'thud', { gain: 0.9 });
  cue(W('verba', 4), 'pop', { gain: 0.4 });

  // ══ L5 · 2011: R$ 3 bi anunciados, nunca chegaram ═════════════════════
  cenaEm(inicio(5), 'L5', '2011: a câmera abre sobre BH (Linha 1 até Vilarinho); cartão R$ 3 BI ANUNCIADOS + carimbo NUNCA CHEGOU', (lt, d, t) => {
    const c = base(t);
    linhas(c, t);
    cartaoAnuncio(g, 540, 760, { k: seg(t, W('anunciaram', 5) - 0.1, W('anunciaram', 5) + 0.3), kValor: seg(t, W('três', 5) - 0.1, W('três', 5) + 0.3) });
    carimbo(g, 560, 975, 'NUNCA CHEGOU', { k: seg(t, W('Nunca', 5) - 0.2, W('Nunca', 5) + 0.05), tam: 74, rot: -0.14, fundo: 'rgba(255,244,220,0.6)' });
    topo(t, 5);
  });
  cue(W('anunciaram', 5), 'pop', { gain: 0.6 });
  cue(W('três', 5), 'sparkle', { dur: 0.5, gain: 0.4 });
  cue(W('Nunca', 5), 'thud', { gain: 0.9 });

  // ══ L6 · 2022: leilão, um lance só ═══════════════════════════════════
  cenaEm(inicio(6), 'L6', '2022: cartão LEILÃO / 1 LANCE / ~R$ 26 MI e martelo que bate em "só"', (lt, d, t) => {
    const c = base(t);
    linhas(c, t);
    const tSo = W('só', 6);
    const sobe = eo(seg(t, W('leilão', 6) - 0.2, W('lance', 6))), bate = seg(t, tSo - 0.14, tSo);
    const ang = 0.8 * sobe * (1 - bate * bate) + (t > tSo ? 0.06 * Math.exp(-(t - tSo) * 9) * Math.sin((t - tSo) * 30) : 0);
    cartaoLeilao(g, 540, 640, { k: seg(t, W('leilão', 6) - 0.1, W('leilão', 6) + 0.3), kValor: seg(t, W('uns', 6) - 0.1, W('uns', 6) + 0.3) });
    martelo(g, 880, 1010, ang, { k: seg(t, W('leilão', 6) - 0.1, W('leilão', 6) + 0.3), impacto: seg(t, tSo, tSo + 0.45) });
    topo(t, 6);
  });
  cue(W('leilão', 6), 'pop', { gain: 0.5 });
  cue(W('só', 6), 'slam', { gain: 0.7 });
  cue(W('uns', 6), 'pop', { gain: 0.5 });

  // ══ L7 · de cada R$ 100, 86 são públicos ══════════════════════════════
  cenaEm(inicio(7), 'L7', 'gráfico DE CADA R$ 100: barras 86 dinheiro público / 14 empresa crescendo em "oitenta e seis"', (lt, d, t) => {
    const c = base(t);
    linhas(c, t);
    graficoCem(g, 540, 760, { k: seg(t, W('cada', 7) - 0.1, W('cada', 7) + 0.3), kb: seg(t, W('oitenta', 7) - 0.1, W('público', 7)) });
    topo(t, 7);
  });
  cue(W('cada', 7), 'pop', { gain: 0.5 });
  cue(W('oitenta', 7), 'tock', { gain: 0.5 });
  cue(W('público', 7), 'tock', { gain: 0.5 });

  // ══ L8 · 2024 → julho de 2026: Nova Suíça e Amazonas abertas ═════════
  cenaEm(inicio(8), 'L8', '2024 → 2026: obras voltam; trecho Calafate → Amazonas acende com as estações Nova Suíça e Amazonas e um trem indo e vindo', (lt, d, t) => {
    const c = base(t);
    const { ob } = linhas(c, t);
    const ponta = mapa.rota(g, c, L2, ob, { alfa: 0 });
    mapa.marcador(g, c, ponta.lon, ponta.lat, { k: eo(seg(t, W('voltaram', 8) - 0.1, W('voltaram', 8) + 0.3)) * (1 - seg(t, W('abriram', 8), W('abriram', 8) + 0.3)), t, cor: OURO, raio: 10 });
    const ka = (n) => eo(seg(t, W('abriram', 8) + 0.25 * n, W('abriram', 8) + 0.25 * n + 0.35));
    const tAb = W('abriram', 8) + 0.7;
    if (t > tAb) {                                                           // trem indo e vindo no trecho aberto
      const ciclo = ((t - tAb) / 3.2) % 1, vai = ciclo < 0.5, u = eio(vai ? ciclo * 2 : 2 - ciclo * 2);
      const p = mapa.rota(g, c, L2, 0.02 + (fAM - 0.04) * u, { alfa: 0 });
      veiculo(g, p.x, p.y, p.ang + (vai ? 0 : Math.PI), { tipo: 'trem', escala: 1.15, k: eo(seg(t, tAb, tAb + 0.3)) });
    }
    mapa.marcador(g, c, ...EST['Nova Suíça'], { k: ka(0), t, cor: OURO, raio: 11 });
    mapa.marcador(g, c, ...EST.Amazonas, { k: ka(1), t: t + 0.5, cor: OURO, raio: 11 });
    mapa.rotulo(g, c, EST['Nova Suíça'][0] + 0.0012, EST['Nova Suíça'][1] + 0.0068, 'Nova Suíça', { k: ka(0), tamanho: 36, ponto: false, lado: 'acima' });   // acima da linha: o trem não passa por cima
    mapa.rotulo(g, c, EST.Amazonas[0] - 0.0025, EST.Amazonas[1], 'Amazonas', { k: ka(1), tamanho: 36, ponto: false, lado: 'esquerda' });
    const kj = eo(seg(t, W('julho', 8) - 0.1, W('julho', 8) + 0.35));
    if (kj <= 0) anoDaLinha(t, 8); else { ano(g, '2024', 1 - kj); ano(g, '2026', kj); }
    rodape(g, creditos);
  });
  cue(W('voltaram', 8), 'zip', { gain: 0.5 });
  cue(W('julho', 8), 'pop', { gain: 0.4 });
  cue(W('abriram', 8), 'sparkle', { dur: 0.9, gain: 0.55 });

  // ══ L9 · e o Barreiro? 2028? ══════════════════════════════════════════
  cenaEm(inicio(9), 'L9', '2028?: voo pelo tracejado até o Barreiro; placa BARREIRO, banco vazio e teia de aranha em "atrasar"', (lt, d, t) => {
    const c = base(t);
    linhas(c, t);
    mapa.marcador(g, c, ...EST['Nova Suíça'], { k: 1, t, cor: OURO, raio: 9 });
    mapa.marcador(g, c, ...EST.Amazonas, { k: 1, t: t + 0.5, cor: OURO, raio: 9 });
    const kB = eo(seg(t, W('Barreiro', 9) - 0.1, W('Barreiro', 9) + 0.3));
    mapa.marcador(g, c, ...BARREIRO, { k: kB, t, cor: '#FFFFFF', raio: 11 });
    mapa.rotulo(g, c, ...BARREIRO, 'Barreiro', { k: kB, tamanho: 40, ponto: false, lado: 'direita' });
    mapa.rotulo(g, c, ...BARREIRO, '2028?  ', { k: eo(seg(t, W('oito', 9) - 0.1, W('oito', 9) + 0.3)), tamanho: 58, ponto: false, lado: 'esquerda', cor: OURO, peso: 900 });
    const [bx, by] = tela(c, BARREIRO);
    estacaoVazia(g, 300, 660, { escala: 0.72, k: seg(t, W('Previsão', 9) - 0.1, W('Previsão', 9) + 0.35), kBanco: seg(t, W('Previsão', 9) + 0.3, W('Previsão', 9) + 0.7), teia: seg(t, W('oito', 9), W('atrasar', 9) + 0.15), t });
    topo(t, 9);
  });
  cue(W('Barreiro', 9), 'pop', { gain: 0.5 });
  cue(W('Previsão', 9), 'pop', { gain: 0.5 });
  cue(W('oito', 9), 'sparkle', { dur: 1.0, gain: 0.3 });

  // ══ L10 · chamada ═════════════════════════════════════════════════════
  const i10 = inicio(10), tClique = W('curiosidades', 10) + 0.15, ultima = script.lines[script.lines.length - 1].text;
  cenaEm(i10, 'L10', 'chamada: o mapa segue abrindo sobre o Barreiro; cartão final e clique em "curiosidades"', (lt, d, t) => {
    const c = base(t);
    linhas(c, t);
    const [bx, by] = tela(c, BARREIRO);
    mapa.marcador(g, c, ...BARREIRO, { k: 1, t, raio: 11 });
    estacaoVazia(g, 300, 660, { escala: 0.72, k: 1 - seg(t, i10 + 0.1, i10 + 0.4), kBanco: 1, teia: 1, t });
    g.save(); g.globalAlpha = 0.45 * eo(seg(t, i10, i10 + 0.3)); g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920); g.restore();
    const sai = 1 - seg(t, i10, i10 + 0.3);
    rodape(g, creditos, { k: sai }); ano(g, ANOS[10], sai);
    cartaoFinal({ marca: script.marca_nome || 'Conhecimento', textoDaUltimaLinha: ultima, k: eo(seg(lt, 0, 0.22)), clique: seg(t, tClique - 0.3, tClique + 0.3) });
  });
  cue(tClique, 'pop', { gain: 0.7 });

  return { cenas, cues };
}
