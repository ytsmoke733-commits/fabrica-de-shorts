// Painéis 2D do caso-real (canvas 1080×1920): o mapa-múndi em pontos com as conexões do ataque e a linha do tempo.
//   mapaMundi({ x, y, w, h, t, conexoes, p, foco })      pontos onde é terra; conexões [[cidadeA, cidadeB], …] em vermelho,
//                                                       uma depois da outra conforme p, com um ponto brilhante na ponta;
//                                                       cidades ligadas com anel pulsando (t = relógio do pulso; `k` é o nome antigo, ainda aceito);
//                                                       foco = cidade com rótulo mono
//   linhaDoTempo({ eventos: [{ data, rotulo }], p, atual, x0, x1, y, t })   linha que se desenha com p, marcos alternando
//                                                       acima/abaixo, data datilografada; o marco `atual` em vermelho pulsando
// Cores e fontes do tema (usarTemaEvidencias em evidencias.mjs). Vermelho só nas conexões, nas cidades ligadas e no marco atual.
import { ctx, clamp, lerp, eo, TAU } from './motor/lib.js';
import { CIDADES, projetar, ehTerra, pontoDoArco } from './mapa.mjs';
import { posicoesNaLinha } from './linha-do-tempo.mjs';
import { datilografar } from './datilografia.mjs';
import { corDoTema, fonteDoTema } from './evidencias.mjs';
import { rgba } from './tema.mjs';

const cidade = (nome) => { const c = CIDADES[nome]; if (!c) throw new Error(`mapaMundi: cidade desconhecida "${nome}" (use um nome de CIDADES em mapa.mjs)`); return c; };

// Grade de pontos de terra por caixa (memorizada: depende só da caixa e do passo). PASSO = passo da grade do mapa (px).
const PASSO = 12;
const GRADES = new Map();
/** pontos [x, y] de uma grade de `passo` px dentro da caixa, só onde ehTerra (projeção equirretangular de mapa.mjs) */
export function pontosDoMapa({ x, y, w, h }, passo = PASSO) {
  const chave = [x, y, w, h, passo].join('|');
  if (!GRADES.has(chave)) {
    const pts = [];
    for (let py = y + passo / 2; py <= y + h; py += passo) {
      for (let px = x + passo / 2; px <= x + w; px += passo) {
        if (ehTerra([((px - x) / w) * 360 - 180, 90 - ((py - y) / h) * 150])) pts.push([px, py]);
      }
    }
    GRADES.set(chave, pts);
  }
  return GRADES.get(chave);
}

/** anel que pulsa: fase 0..1 abre de r0 a r1 e some */
function anel(x, y, fase, r0, r1, cor, larg = 4) {
  ctx.save(); ctx.globalAlpha *= (1 - fase) * 0.85; ctx.beginPath(); ctx.arc(x, y, lerp(r0, r1, fase), 0, TAU);
  ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.stroke(); ctx.restore();
}

/** o mapa-múndi em pontos com as conexões do caso */
export function mapaMundi({ x = 40, y = 520, w = 1000, h = 520, k = 1, t, conexoes = [], p = 1, foco = null } = {}) {
  k = t ?? k;                                                            // `t` é o nome recomendado do relógio; `k` segue aceito
  const caixa = { x, y, w, h }, vermelho = corDoTema('perigo'), texto = corDoTema('texto');
  const pares = conexoes.map(([a, b]) => [cidade(a), cidade(b)]), pFoco = foco == null ? null : projetar(cidade(foco), caixa);
  // 1) os continentes em pontos (um pouco mais claros perto do foco: a luz da cena)
  ctx.save();
  for (const [px, py] of pontosDoMapa(caixa, PASSO)) {
    const luz = pFoco ? Math.exp(-((px - pFoco[0]) ** 2 + (py - pFoco[1]) ** 2) / (2 * 260 ** 2)) : 0;
    ctx.fillStyle = rgba(texto, 0.32 + 0.26 * luz); ctx.beginPath(); ctx.arc(px, py, PASSO * 0.27, 0, TAU); ctx.fill();
  }
  ctx.restore();
  // 2) as conexões, uma depois da outra conforme p
  const n = pares.length, chegou = new Set();
  pares.forEach(([a, b], i) => {
    const q = clamp(p * n - i); if (q <= 0) return;
    chegou.add(conexoes[i][0]); if (q >= 1) chegou.add(conexoes[i][1]);
    const passos = Math.max(2, Math.ceil(48 * q));
    ctx.save(); ctx.shadowColor = vermelho; ctx.shadowBlur = 14; ctx.beginPath();
    for (let j = 0; j <= passos; j++) { const [px, py] = pontoDoArco(a, b, (j / passos) * q, 0.25, caixa); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.strokeStyle = vermelho; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    if (q < 1) {                                                         // o ponto brilhante na ponta
      const [hx, hy] = pontoDoArco(a, b, q, 0.25, caixa);
      ctx.shadowBlur = 26; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fillStyle = vermelho; ctx.fill();
      ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, TAU); ctx.fillStyle = texto; ctx.fill();
    }
    ctx.restore();
  });
  // 3) as cidades ligadas: ponto vermelho + anel pulsando (fase vinda de k, defasada por cidade)
  [...chegou].forEach((nome, i) => {
    const [cx, cy] = projetar(cidade(nome), caixa);
    anel(cx, cy, (((k * 0.8 + i * 0.37) % 1) + 1) % 1, 8, 36, vermelho, 3);
    ctx.save(); ctx.shadowColor = vermelho; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fillStyle = vermelho; ctx.fill(); ctx.restore();
  });
  // 4) o foco: ponto claro (se não estiver ligado) e rótulo mono com linha-guia
  if (pFoco) {
    const [fx, fy] = pFoco, nome = foco.toLocaleUpperCase('pt-BR');
    if (!chegou.has(foco)) { ctx.beginPath(); ctx.arc(fx, fy, 6, 0, TAU); ctx.fillStyle = texto; ctx.fill(); }
    ctx.save(); ctx.font = fonteDoTema('mono', 700, 34); const tw = ctx.measureText(nome).width;
    const dir = fx + 40 + tw > x + w + 30 ? -1 : 1, lx = fx + dir * 34, ly = fy - 58;
    ctx.strokeStyle = rgba(texto, 0.8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(fx + dir * 8, fy - 8); ctx.lineTo(lx, ly + 10); ctx.lineTo(lx + dir * (tw + 8), ly + 10); ctx.stroke();
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10; ctx.fillStyle = texto; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = dir > 0 ? 'left' : 'right'; ctx.fillText(nome, lx + dir * 4, ly);
    ctx.restore();
  }
}

/** a linha do tempo: linha que se desenha com p, marcos com data (mono) e rótulo (sans); o `atual` em vermelho pulsando */
export function linhaDoTempo({ eventos, p, atual = -1, x0 = 120, x1 = 960, y = 960, t = 0 }) {
  if (p <= 0) return;
  const a0 = ctx.globalAlpha;                                            // alfa de quem chama: o que se desenha aqui o respeita e o devolve
  const texto = corDoTema('texto'), vermelho = corDoTema('perigo'), L = clamp(p / 0.6), xf = lerp(x0, x1, L);
  ctx.save();
  // a linha e a ponta que anda
  ctx.strokeStyle = rgba(texto, 0.55); ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xf, y); ctx.stroke();
  if (L < 1) { ctx.beginPath(); ctx.arc(xf, y, 6, 0, TAU); ctx.fillStyle = texto; ctx.fill(); }
  // os marcos
  posicoesNaLinha(eventos.length, { x0, x1, y }).forEach(({ x, lado }, i) => {
    const f = x1 === x0 ? 0 : (x - x0) / (x1 - x0), km = clamp((p - 0.6 * f) / 0.08); if (km <= 0) return;
    const ev = eventos[i], ehAtual = i === atual, kt = clamp((p - 0.6 * f - 0.04) / 0.3);
    // haste até o texto
    ctx.strokeStyle = rgba(texto, 0.35 * km); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + lado * 20); ctx.lineTo(x, y + lado * lerp(20, 42, km)); ctx.stroke();
    // o marco
    if (ehAtual) {
      anel(x, y, ((t * 0.9) % 1 + 1) % 1, 18, 52, vermelho, 4);
      ctx.save(); ctx.shadowColor = vermelho; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(x, y, 18 * eo(km), 0, TAU); ctx.fillStyle = vermelho; ctx.fill(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(x, y, 14 * eo(km), 0, TAU); ctx.fillStyle = corDoTema('vazio'); ctx.fill();
      ctx.strokeStyle = texto; ctx.lineWidth = 4; ctx.stroke();
    }
    // data datilografada e rótulo (centrados no marco, sem sair da tela)
    const centro = (tw) => clamp(x, 60 + tw / 2, 1020 - tw / 2);
    const yData = lado < 0 ? y - 112 : y + 92, yRot = lado < 0 ? y - 62 : y + 142;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10;
    ctx.font = fonteDoTema('mono', 700, 44); const dw = ctx.measureText(ev.data).width;
    ctx.fillStyle = texto; ctx.textAlign = 'left'; ctx.fillText(datilografar(ev.data, kt * 1.5), centro(dw) - dw / 2, yData);
    if (kt > 0) {
      ctx.font = fonteDoTema('sans', 800, 40); const rw = ctx.measureText(ev.rotulo).width;
      ctx.globalAlpha = a0 * clamp((kt - 0.4) / 0.4) * 0.85; ctx.fillText(ev.rotulo, centro(rw) - rw / 2, yRot); ctx.globalAlpha = a0;
    }
    ctx.shadowBlur = 0;
  });
  ctx.restore();
}
