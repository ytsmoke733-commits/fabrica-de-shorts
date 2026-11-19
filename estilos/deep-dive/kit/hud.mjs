// HUD 2D do deep-dive (base do voxel + ícones do v2) (canvas, por cima do 3D e por baixo das legendas), com as cores do tema:
//   pilula(icone, rotulo, valor, k, flip)   cartão translúcido no canto superior esquerdo, borda `hud`
//   manchete(linhas, k, out, size)          2-3 linhas grandes em caixa alta, uma *palavra* em `hud`
//   etiquetaLenta(k, t)                     "CÂMERA LENTA" no canto superior direito
//   rotuloGuia(texto, x, y, tx, ty, k)      rótulo com linha-guia até um ponto (tx, ty)
//   cartaoFinal({ marca, textoDaUltimaLinha, k, clique })   cartão de seguir/inscrever
//   comCameraLenta(draw, { fator, etiqueta })   embrulha o draw de uma cena: tempo lento + etiqueta automática
// Layout (1080×1920): pílula y 128-220 · manchete y 250-560 · rostos y 640-1280 · cartão final y 620-1020 · legendas em y 1480.
import { ctx, clamp, lerp, seg, eo, eob } from './motor/lib.js';
import { CAMERA_LENTA } from './cameras.mjs';
import { rgba } from './tema.mjs';

const PX = 44, PY = 128, PH = 92;
let T = { cores: { texto: '#FFFFFF', destaque: '#FFD43B', contorno: '#111', hud: '#4FD1E8', painel: '#09101E', perigo: '#FF4646' }, fontes: { sans: 'Inter' } };
/** guarda o tema usado por todas as funções de desenho */
export function usarTema(tema) { T = tema; }
const C = () => T.cores, F = (peso, px) => `${peso} ${px}px ${T.fontes.sans}`;

function icon(name, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = C().hud; ctx.fillStyle = C().hud; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (name === 'spin') {                       // um globo com seta girando
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 7, 17, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(17, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 25, -2.6, -0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(25 * Math.cos(-0.5) + 6, 25 * Math.sin(-0.5) - 6); ctx.lineTo(25 * Math.cos(-0.5), 25 * Math.sin(-0.5)); ctx.lineTo(25 * Math.cos(-0.5) - 7, 25 * Math.sin(-0.5) - 2); ctx.stroke();
  } else if (name === 'stop') {
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.stroke(); ctx.fillRect(-9, -9, 18, 18);
  } else if (name === 'wind') {
    for (const [yy, len] of [[-12, 30], [0, 38], [12, 24]]) { ctx.beginPath(); ctx.moveTo(-22, yy); ctx.lineTo(-22 + len, yy); ctx.arc(-22 + len, yy - 6, 6, Math.PI / 2, -Math.PI * 0.9, true); ctx.stroke(); }
  } else if (name === 'wave') {
    ctx.beginPath(); ctx.moveTo(-24, 10); for (let i = 0; i <= 48; i += 4) ctx.lineTo(-24 + i, 10 - Math.sin(i / 48 * Math.PI * 2) * 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, -2); ctx.quadraticCurveTo(-4, -26, 14, -12); ctx.quadraticCurveTo(4, -12, 6, -2); ctx.stroke();
  } else if (name === 'globe') {
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 9, 20, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -16, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, 16, 4, 0, 7); ctx.fill();
  } else if (name === 'sun') {
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.lineTo(Math.cos(a) * 23, Math.sin(a) * 23); ctx.stroke(); }
  } else if (name === 'moon') {
    ctx.beginPath(); ctx.arc(0, 0, 19, 0.6, Math.PI * 2 - 0.6); ctx.arc(9, -2, 14, Math.PI * 2 - 1.2, 1.2, true); ctx.closePath(); ctx.fill();
  } else if (name === 'pin') {
    ctx.beginPath(); ctx.arc(0, -6, 13, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0, 20); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -6, 5, 0, 7); ctx.fill();
  } else if (name === 'drop') {
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.bezierCurveTo(8, -8, 16, 0, 16, 7); ctx.arc(0, 7, 16, 0, Math.PI); ctx.bezierCurveTo(-16, 0, -8, -8, 0, -20); ctx.stroke(); ctx.beginPath(); ctx.arc(-5, 9, 4, 0, 7); ctx.fill();
  } else if (name === 'bolinha') {              // blob de bordas onduladas com dois brilhos (o 'gum' do v2)
    ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 16 + 3 * Math.sin(a * 5); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(-5, -4, 3.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(6, 5, 2.5, 0, 7); ctx.fill();
  } else if (name === 'warn') {
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(20, 16); ctx.lineTo(-20, 16); ctx.closePath(); ctx.stroke(); ctx.fillRect(-2.5, -8, 5, 13); ctx.beginPath(); ctx.arc(0, 10, 3, 0, 7); ctx.fill();
  } else if (name === 'clock') {
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -12); ctx.moveTo(0, 0); ctx.lineTo(9, 5); ctx.stroke();
  }
  ctx.restore();
}

/** a pílula de dado. k = entrada 0..1 (escala + fade), flip = 0..1 um amassadinho rápido quando o valor muda */
export function pilula(ic, rotulo, valor, k = 1, flip = 0) {
  if (k <= 0) return;
  ctx.save(); ctx.font = F(800, 34); const lw = ctx.measureText(rotulo).width; ctx.font = F(900, 48); ctx.letterSpacing = '-0.5px'; const vw = ctx.measureText(valor).width; ctx.letterSpacing = '0px';
  const w = 96 + lw + 18 + vw + 34, sy = 1 - 0.35 * Math.sin(clamp(flip) * Math.PI);
  ctx.globalAlpha = clamp(k * 1.5); ctx.translate(PX, PY + PH / 2); ctx.scale(lerp(0.85, 1, eob(clamp(k))), lerp(0.85, 1, eob(clamp(k))) * sy);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  ctx.fillStyle = rgba(C().painel, 0.72); ctx.beginPath(); ctx.roundRect(0, -PH / 2, w, PH, 26); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C().hud; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = rgba(C().hud, 0.16); ctx.beginPath(); ctx.roundRect(10, -PH / 2 + 10, 70, PH - 20, 18); ctx.fill();
  icon(ic, 45, 0, 1);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.font = F(800, 34); ctx.fillStyle = rgba(C().texto, 0.78); ctx.fillText(rotulo, 96, 3);
  ctx.font = F(900, 48); ctx.letterSpacing = '-0.5px'; ctx.fillStyle = C().texto; ctx.fillText(valor, 96 + lw + 18, 3); ctx.letterSpacing = '0px';
  ctx.restore();
}

/** a manchete: linhas como ['E SE A TERRA', 'PARASSE DE', '*GIRAR*?'] (*palavra* = cor hud). k = entrada 0..1, out = saída 0..1 */
export function manchete(linhas, k = 1, out = 0, size = 92) {
  if (k <= 0 || out >= 1) return;
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round'; ctx.letterSpacing = '-2px';
  const lh = size * 1.04, y0 = 262 + size * 0.8;
  linhas.forEach((ln, i) => {
    const kk = eo(seg(k, i * 0.18, i * 0.18 + 0.6)), oo = eo(seg(out, 0, 1)); if (kk <= 0) return;
    const parts = ln.split(/(\*[^*]+\*)/).filter(Boolean);
    ctx.font = F(900, size);
    let x = PX + (1 - kk) * -40; const y = y0 + i * lh;
    ctx.globalAlpha = kk * (1 - oo);
    const full = parts.map((p) => p.replace(/\*/g, '')).join(''), fw = ctx.measureText(full).width, sc = Math.min(1, (1080 - PX * 2) / fw);   // encolhe linha longa
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); x = 0;
    for (const p of parts) {
      const hi = p.startsWith('*'), tx = p.replace(/\*/g, ''); const w = ctx.measureText(tx).width;
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = C().contorno; ctx.strokeText(tx, x, 6); ctx.strokeText(tx, x, 0);
      ctx.fillStyle = hi ? C().hud : C().texto; ctx.fillText(tx, x, 0); x += w;
    }
    ctx.restore();
  });
  ctx.restore();
}

/** etiqueta "CÂMERA LENTA", canto superior direito */
export function etiquetaLenta(k, t) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.font = F(900, 30); ctx.letterSpacing = '1px';
  const txt = 'CÂMERA LENTA', w = ctx.measureText(txt).width + 74, x = 1080 - PX - w, y = PY + 14;
  ctx.fillStyle = rgba(C().painel, 0.7); ctx.beginPath(); ctx.roundRect(x, y, w, 62, 31); ctx.fill();
  ctx.fillStyle = rgba(C().perigo, 0.55 + 0.45 * Math.abs(Math.sin(t * 3))); ctx.beginPath(); ctx.arc(x + 32, y + 31, 9, 0, 7); ctx.fill();
  ctx.fillStyle = C().texto; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 52, y + 33); ctx.restore();
}

/** milhar em pt-BR: 1670 → "1.670" */
export const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** rótulo flutuante com linha-guia até um ponto 3D projetado (tx, ty) */
export function rotuloGuia(texto, x, y, tx, ty, k = 1) {
  if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
  ctx.strokeStyle = C().hud; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lerp(x, tx, eo(clamp(k))), lerp(y, ty, eo(clamp(k)))); ctx.stroke();
  ctx.fillStyle = C().hud; ctx.beginPath(); ctx.arc(tx, ty, 10 * clamp(k * 2 - 1), 0, 7); ctx.fill();
  ctx.translate(x, y); const s = lerp(0.7, 1, eob(clamp(k))); ctx.scale(s, s);
  ctx.font = F(900, 50); const w = ctx.measureText(texto).width + 48;
  ctx.fillStyle = rgba(C().painel, 0.78); ctx.beginPath(); ctx.roundRect(-w / 2, -40, w, 80, 24); ctx.fill(); ctx.strokeStyle = C().hud; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = C().texto; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(texto, 0, 3); ctx.restore();
}

/** botão do cartão final conforme a plataforma: "inscrev" na última linha → Shorts; senão TikTok/Reels */
export function chamadaDaPlataforma(textoDaUltimaLinha) {
  return /inscrev/i.test(textoDaUltimaLinha || '')
    ? { botao: 'Inscrever-se', feito: 'Inscrito ✓' }
    : { botao: 'Seguir', feito: 'Seguindo ✓' };
}

/** escala (≤ 1) para um texto de largura `largura` caber em `max` px */
export const escalaQueCabe = (largura, max) => (largura > max ? max / largura : 1);

/** cartão final de seguir/inscrever (y 620-1020, largura 820). k = entrada 0..1; clique > 0,5 troca o botão pelo estado "feito" */
export function cartaoFinal({ marca, textoDaUltimaLinha, k = 1, clique = 0 }) {
  if (k <= 0) return;
  const { botao, feito } = chamadaDaPlataforma(textoDaUltimaLinha), ok = clique > 0.5;
  const W = 820, H = 400, cx = 540, cy = 820, s = lerp(0.82, 1, eob(clamp(k)));
  ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 10;
  ctx.fillStyle = rgba(C().painel, 0.82); ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, 44); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C().hud; ctx.lineWidth = 5; ctx.stroke();
  // avatar redondo com a inicial da marca
  const ay = -H / 2 + 112;
  ctx.fillStyle = C().hud; ctx.beginPath(); ctx.arc(-W / 2 + 120, ay, 66, 0, 7); ctx.fill();
  ctx.fillStyle = C().contorno; ctx.font = F(900, 80); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((marca || '?').trim().charAt(0).toUpperCase(), -W / 2 + 120, ay + 5);
  ctx.fillStyle = C().texto; ctx.textAlign = 'left'; ctx.font = F(900, 62);
  const nx = -W / 2 + 214, ns = escalaQueCabe(ctx.measureText(marca || '').width, W / 2 - 40 - nx);   // nome longo encolhe para caber no cartão
  ctx.save(); ctx.translate(nx, ay + 4); ctx.scale(ns, ns); ctx.fillText(marca || '', 0, 0); ctx.restore();
  // botão
  const bw = W - 120, bh = 112, by = H / 2 - 70 - bh / 2, pop = ok ? 1 + 0.06 * Math.sin(clamp((clique - 0.5) * 4) * Math.PI) : 1;
  ctx.save(); ctx.translate(0, by + bh / 2); ctx.scale(pop, pop);
  ctx.fillStyle = ok ? rgba(C().painel, 0.9) : C().destaque; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 56); ctx.fill();
  if (ok) { ctx.strokeStyle = C().hud; ctx.lineWidth = 5; ctx.stroke(); }
  ctx.fillStyle = ok ? C().texto : C().contorno; ctx.textAlign = 'center'; ctx.font = F(900, 56); ctx.fillText(ok ? feito : botao, 0, 4);
  ctx.restore();
  ctx.restore();
}

/** embrulha o draw de uma cena em câmera lenta. O draw original recebe `lt` e `d` escalados por `fator` (então `lt/d` continua sendo o progresso real da cena e só ações em segundos absolutos ficam lentas); `t` e a etiqueta usam o tempo real. */
export function comCameraLenta(draw, { fator = CAMERA_LENTA, etiqueta = etiquetaLenta } = {}) {
  return (lt, d, t, blit) => { draw(lt * fator, d * fator, t, blit); etiqueta(seg(lt, 0, 0.25), t); };
}
