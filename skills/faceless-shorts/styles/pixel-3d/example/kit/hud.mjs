// HUD do pixel: tudo na fonte pixel 5x7, com cantoneiras laranja e tarjas escuras. Desenha no canvas 2D DEPOIS do blit()
// e antes da legenda. Cores do tema (usarTema, uma vez no boot): hud = cantoneiras/linhas, texto = letras, painel = tarjas.
import { ctx, clamp, eo, eob } from './motor/lib.js';
import { textoPixel, larguraTexto } from './pixelfonte.mjs';
import { rgba } from './tema.mjs';

let T = { cores: { texto: '#FFF1C1', destaque: '#FFB43A', contorno: '#1A0F0A', hud: '#FFB43A', painel: '#140C08', perigo: '#FF4646' } };
export function usarTema(tema) { T = tema; }
const C = () => T.cores;
const R = Math.round;

/** cantoneiras (os 4 cantos de um retângulo): espessura e, comprimento len */
export function cantos(x, y, w, h, e, len, cor = C().hud) {
  ctx.fillStyle = cor;
  const L = (a, b, c, d) => ctx.fillRect(R(a), R(b), R(c), R(d));
  L(x, y, len, e); L(x, y, e, len); L(x + w - len, y, len, e); L(x + w - e, y, e, len);
  L(x, y + h - e, len, e); L(x, y + h - len, e, len); L(x + w - len, y + h - e, len, e); L(x + w - e, y + h - len, e, len);
}

/** quantos caracteres de `txt` aparecem no progresso k (máquina de escrever: completo em k = 1/1,6) */
export const letrasVisiveis = (txt, k) => Math.ceil(String(txt).length * clamp(k * 1.6));

/**
 * Valor grande no topo entre cantoneiras ("[ 2,45 GHZ ]"), com subtítulo opcional numa tarja escura.
 * k 0..1 = entrada (cantoneiras abrem, letras datilografadas); out 0..1 = saída. y = topo das letras; s = pixel da fonte.
 */
export function valorTopo(valor, sub = null, k = 1, out = 0, { y = 150, s = 12 } = {}) {
  if (k <= 0 || out >= 1) return;
  const v = String(valor), a = clamp(k * 3) * (1 - out);
  let sz = s; while (sz > 5 && larguraTexto(v, sz) > 900) sz--;
  const wFull = larguraTexto(v, sz), pad = 4 * sz, w = wFull + pad * 2, h = 7 * sz + pad * 1.6;
  const ww = w * (0.6 + 0.4 * eob(clamp(k * 2.2))), x = 540 - ww / 2, yy = y - pad * 0.8;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rgba(C().painel, 0.35); ctx.fillRect(R(x), R(yy), R(ww), R(h));
  cantos(x, yy, ww, h, sz * 0.75, sz * 3);
  textoPixel(v.slice(0, letrasVisiveis(v, k)), 540 - wFull / 2, y, { s: sz, cor: C().texto, contorno: C().contorno, alinhar: 'left' });
  if (sub) {
    let ss = 4; const sy = yy + h + 22;
    while (ss > 2 && larguraTexto(sub, ss) > 960) ss--;
    const sw = larguraTexto(sub, ss) + 28;
    ctx.globalAlpha = a * clamp((k - 0.35) * 3);
    ctx.fillStyle = rgba(C().painel, 0.82); ctx.fillRect(R(540 - sw / 2), R(sy), R(sw), 7 * ss + 22);
    textoPixel(sub, 540, sy + 11, { s: ss, cor: C().texto, contorno: null });
  }
  ctx.restore();
}

/**
 * Etiqueta pequena centrada em (x, y), com linha-guia em L (horizontal, depois vertical) até o ponto (tx, ty) da tela,
 * onde fica um quadradinho laranja. k 0..1. Projete o ponto 3D com projetar() de mundo/pecas.js.
 */
export function etiqueta(txt, x, y, tx, ty, k = 1, { s = 5, cor } = {}) {
  if (k <= 0) return;
  const kk = eo(clamp(k * 1.8)), mx = x + (tx - x) * kk, my = y + (ty - y) * kk;
  ctx.save(); ctx.globalAlpha = clamp(k * 2.5);
  ctx.fillStyle = C().hud;
  ctx.fillRect(R(Math.min(x, mx)), R(y), R(Math.abs(mx - x)) + 4, 4);
  ctx.fillRect(R(mx), R(Math.min(y, my)), 4, R(Math.abs(my - y)) + 4);
  if (kk > 0.98) { ctx.fillRect(R(tx) - 8, R(ty) - 8, 16, 16); ctx.fillStyle = C().contorno; ctx.fillRect(R(tx) - 4, R(ty) - 4, 8, 8); }
  const p = 6, w = larguraTexto(txt, s) + p * 4, h0 = 7 * s + p * 3, h = h0 + 2 * s; // + 2 linhas da fonte para a vírgula e a cedilha
  ctx.fillStyle = rgba(C().painel, 0.82); ctx.fillRect(R(x - w / 2), R(y - h0 / 2), R(w), R(h));
  cantos(x - w / 2, y - h0 / 2, w, h, 4, 12);
  textoPixel(txt, x, y - (7 * s) / 2, { s, cor: cor || C().texto, contorno: null });
  ctx.restore();
}

/** botão do cartão final conforme a plataforma: "inscrev" na última linha → Shorts; senão TikTok/Reels */
export function chamadaDaPlataforma(textoDaUltimaLinha) {
  return /inscrev/i.test(textoDaUltimaLinha || '')
    ? { botao: 'Inscrever-se', feito: 'Inscrito ✓' }
    : { botao: 'Seguir', feito: 'Seguindo ✓' };
}

/** maior tamanho de pixel (de `max` até `min`) com que `txt` cabe em `largura` px */
export function tamanhoQueCabe(txt, largura, max = 6, min = 3) {
  let s = max; while (s > min && larguraTexto(txt, s) > largura) s--;
  return s;
}

/** @ do perfil a partir do nome da marca: minúsculas, sem acento nem espaço */
export const arroba = (marca) => '@' + String(marca).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/** @ do cartão: o do perfil (marca.arroba / script.marca_arroba) quando existe; senão, derivado do nome */
export const arrobaDoCartao = (marca, perfil) => (perfil ? '@' + String(perfil).replace(/^@/, '') : arroba(marca));

/** cartão final pixel (y 700-1000, largura 760): avatar, nome, @ e botão. k = entrada; clique > 0,5 = estado "feito" */
export function cartaoFinal({ marca = 'Conhecimento', arroba: perfil = '', textoDaUltimaLinha = '', k = 1, clique = 0 }) {
  if (k <= 0) return;
  const ch = chamadaDaPlataforma(textoDaUltimaLinha), feito = clique > 0.5;
  const y = 700 + (1 - eob(clamp(k))) * 60, w = 760, h = 300, x = 540 - w / 2;
  ctx.save(); ctx.globalAlpha = clamp(k * 2.5);
  ctx.fillStyle = rgba(C().painel, 0.88); ctx.fillRect(x, y, w, h);
  cantos(x, y, w, h, 6, 36);
  ctx.fillStyle = C().hud; ctx.fillRect(x + 48, y + 48, 96, 96);
  textoPixel(marca.slice(0, 1), x + 96, y + 75, { s: 6, cor: C().contorno, contorno: null });
  const s = tamanhoQueCabe(marca, w - 220);
  textoPixel(marca, x + 176, y + 70, { s, cor: C().texto, contorno: null, alinhar: 'left' });
  textoPixel(arrobaDoCartao(marca, perfil), x + 176, y + 70 + 9 * s, { s: 3, cor: rgba(C().texto, 0.7), contorno: null, alinhar: 'left' });
  const by = y + 186, bw = w - 96, bx = x + 48, aperto = Math.abs(clique - 0.5) < 0.12 ? 6 : 0;
  ctx.fillStyle = feito ? rgba(C().texto, 0.18) : C().hud; ctx.fillRect(bx, by + aperto, bw, 76);
  textoPixel((feito ? ch.feito : ch.botao).toUpperCase(), 540, by + 20 + aperto, { s: 5, cor: feito ? C().texto : C().contorno, contorno: null });
  ctx.restore();
}
