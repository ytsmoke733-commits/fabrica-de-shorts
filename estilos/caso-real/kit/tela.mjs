// Tela de computador genérica (canvas 2D): código inofensivo de codigo.mjs digitado em verde e, por cima, um alerta.
//   desenharTela(g, w, h, { seed, linhas, k, cursor, alerta, kAlerta, t }) → chave do conteúdo (string)
// Desenha em qualquer contexto `g` (a textura do monitor 3D ou o canvas principal), de (0, 0) a (w, h). A chave é função
// só do que aparece (letras digitadas, cursor aceso, alerta), para o monitor 3D só subir a textura quando ela muda.
import { clamp, lerp, eob } from './motor/lib.js';
import { linhasDeCodigo, alertaGenerico } from './codigo.mjs';
import { letrasVisiveis, cursorAceso } from './datilografia.mjs';
import { corDoTema, fonteDoTema, mistura, quebrarTexto } from './evidencias.mjs';
import { rgba } from './tema.mjs';

const COLUNAS = 44;   // a linha mais longa do vocabulário tem 39 letras + 4 da numeração

/** ícone do alerta em (0, 0), tamanho r: cadeado (bloqueado), triângulo com ! (invasao), visto (ok) */
function iconeDoAlerta(g, tipo, r, cor) {
  g.save(); g.strokeStyle = cor; g.fillStyle = cor; g.lineWidth = r * 0.16; g.lineCap = 'round'; g.lineJoin = 'round';
  if (tipo === 'bloqueado') {
    g.beginPath(); g.arc(0, -r * 0.18, r * 0.42, Math.PI, 0); g.stroke();
    g.beginPath(); g.roundRect(-r * 0.66, -r * 0.18, r * 1.32, r * 0.98, r * 0.14); g.fill();
    g.fillStyle = corDoTema('painel'); g.beginPath(); g.arc(0, r * 0.22, r * 0.14, 0, Math.PI * 2); g.fill(); g.fillRect(-r * 0.05, r * 0.26, r * 0.1, r * 0.3);
  } else if (tipo === 'invasao') {
    g.beginPath(); g.moveTo(0, -r * 0.8); g.lineTo(r * 0.85, r * 0.7); g.lineTo(-r * 0.85, r * 0.7); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, -r * 0.3); g.lineTo(0, r * 0.2); g.stroke(); g.beginPath(); g.arc(0, r * 0.45, r * 0.08, 0, Math.PI * 2); g.fill();
  } else {
    g.beginPath(); g.arc(0, 0, r * 0.8, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-r * 0.35, 0); g.lineTo(-r * 0.08, r * 0.28); g.lineTo(r * 0.4, -r * 0.3); g.stroke();
  }
  g.restore();
}

/** a tela: fundo `painel`, código digitado conforme k, cursor piscando por t e o alerta entrando com kAlerta */
export function desenharTela(g, w, h, { seed = 1, linhas = 14, k = 1, cursor = true, alerta = null, kAlerta = 0, t = 0 } = {}) {
  const [titulo, subtitulo] = alerta ? alertaGenerico(alerta) : ['', ''];   // tipo desconhecido lança
  const texto = linhasDeCodigo(seed, linhas).join('\n'), n = letrasVisiveis(k, texto.length), visivel = texto.slice(0, n);
  const aceso = cursor && cursorAceso(t), ka = alerta ? Math.round(clamp(kAlerta) * 30) / 30 : 0;
  const chave = [w, h, seed, linhas, n, aceso ? 1 : 0, ka > 0 ? alerta : '-', ka].join('|');
  const verde = corDoTema('destaque'), painel = corDoTema('painel');
  g.save();
  // fundo: painel com o centro levemente aceso
  g.fillStyle = painel; g.fillRect(0, 0, w, h);
  const brilho = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.7);
  brilho.addColorStop(0, rgba(verde, 0.06)); brilho.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = brilho; g.fillRect(0, 0, w, h);
  // o código (numeração apagada à esquerda), digitado
  const m = Math.min(w, h) * 0.07, px = Math.min((h - 2 * m) / (linhas + 1) / 1.35, (w - 2 * m) / (COLUNAS * 0.6)), lh = px * 1.35;
  g.font = fonteDoTema('mono', 700, px); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const partes = n > 0 ? visivel.split('\n') : [], xCod = m + 4 * 0.6 * px;
  partes.forEach((l, i) => {
    const yy = m + (i + 1) * lh;
    g.shadowBlur = 0; g.fillStyle = rgba(verde, 0.3); g.fillText(String(i + 1).padStart(2, '0'), m, yy);
    g.shadowColor = rgba(verde, 0.6); g.shadowBlur = px * 0.35; g.fillStyle = verde; g.fillText(l, xCod, yy);
  });
  g.shadowBlur = 0;
  if (aceso) {
    const i = Math.max(0, partes.length - 1), larg = partes.length ? g.measureText(partes[i]).width : 0;
    g.fillStyle = verde; g.fillRect(xCod + larg + px * 0.08, m + (i + 1) * lh - px * 0.78, px * 0.55, px * 0.9);
  }
  // linhas de varredura
  g.fillStyle = 'rgba(0,0,0,0.16)'; for (let yy = 0; yy < h; yy += 4) g.fillRect(0, yy, w, 1.5);
  // o alerta
  if (ka > 0) {
    const cor = alerta === 'ok' ? verde : corDoTema('perigo'), bw = w * 0.84, pad = bw * 0.07, sz = bw * 0.085, r = sz * 0.75;
    g.fillStyle = `rgba(0,0,0,${0.6 * ka})`; g.fillRect(0, 0, w, h);
    g.font = fonteDoTema('sans', 900, sz); const tl = quebrarTexto(g, titulo, bw - 2 * pad);
    const fTit = Math.min(1, ...tl.map((l) => (bw - 2 * pad) / g.measureText(l).width));
    const bh = pad * 2 + r * 2 + sz * 0.5 + tl.length * sz * fTit * 1.08 + sz * 0.9;
    g.save(); g.translate(w / 2, h / 2); const e = lerp(0.82, 1, eob(ka)); g.scale(e, e); g.globalAlpha = clamp(ka * 2);
    g.shadowColor = cor; g.shadowBlur = sz * 0.6; g.fillStyle = mistura(painel, cor, 0.08); g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, sz * 0.25); g.fill();
    g.shadowBlur = 0; g.strokeStyle = cor; g.lineWidth = Math.max(3, sz * 0.08); g.stroke();
    let yy = -bh / 2 + pad + r; g.save(); g.translate(0, yy); iconeDoAlerta(g, alerta, r, cor); g.restore();
    yy += r + sz * 0.5; g.textAlign = 'center'; g.textBaseline = 'top';
    g.font = fonteDoTema('sans', 900, sz * fTit); g.fillStyle = cor;
    for (const l of tl) { g.fillText(l, 0, yy); yy += sz * fTit * 1.08; }
    g.font = fonteDoTema('mono', 700, sz * 0.55); g.fillStyle = corDoTema('texto'); g.fillText(subtitulo, 0, yy + sz * 0.25);
    g.restore();
  }
  g.restore();
  return chave;
}
