// Evidências 2D do caso-real (canvas 1080×1920, por cima do 3D e por baixo das legendas). Portes do kit.js do Night File
// (NF/src/core/kit.js e o paper() de NF/src/shots.js) com as cores do tema e textos em português, mais o recorte de jornal.
//   usarTemaEvidencias(tema)                                   guarda o tema (extras com fallback); painéis e tela leem daqui
//   ficha(x, y, s, rotulo, carimbo, kCarimbo, rot)              pasta do caso com etiqueta e carimbo vermelho (cai do 1,8× ao 1×)
//   polaroid(x, y, s, rot, tipo)                                'escuro' | 'alvo' | 'casa' | 'tela' | 'vazio'
//   papel(x, y, w, h, rot, linhas, k)                           folha com linhas [[texto, tamanho, cor, dy]]; k = escala 0..1
//   circuloVermelho(x, y, rx, ry, p)                            círculo à mão que se desenha com p
//   dataDatilografada(linha1, linha2, p, x, y)                  data datilografada (linha 2 em perigo) com cursor
//   tarjas(x, y, larguras, p) · marcador(x, y, s, n) · relogio(x, y, s, hh, mm)
//   recorteDeJornal(x, y, s, rot, { titulo, subtitulo, jornal, data }, k)   recorte amarelado de borda rasgada (nome genérico)
//   filme(t, vinheta)                                           vinheta + grão (chame por último, antes das legendas)
// Vermelho (perigo/alvo) só no carimbo, no círculo, na linha 2 da data e na pessoa do caso ('alvo'). Tudo função de p/k/t:
// nada de aleatório solto (borda rasgada e grão vêm de rnd com semente fixa).
import { ctx, W, H, TAU, lerp, clamp, eo, rnd, rr, circle, ell, line } from './motor/lib.js';
import { datilografar } from './datilografia.mjs';
import { escalaQueCabe } from './hud.mjs';
import { rgba } from './tema.mjs';

// Cores do tema B; os extras (alvo, brasa, papel...) caem nestes valores (os do Night File) se o tema não trouxer.
const PADRAO = {
  texto: '#EAE3D2', destaque: '#3CFF7A', contorno: '#06070A', hud: '#3CFF7A', painel: '#0B0F0E', perigo: '#E4322B',
  alvo: '#E4322B', brasa: '#8E1D1A', papel: '#D8CFBA', pasta: '#B8955A', luz: '#F1D9A6', fita: '#E9C46A', vazio: '#0A0C11',
};
// Tons neutros dos lugares escuros (quarto, meia-luz, parede) e da tinta cinza do papel: não são do tema, são do estilo.
const NEUTRO = { quarto: '#151A24', foto: '#1B212D', parede: '#2B3343', aro: '#2A303D', tinta: 'rgba(0,0,0,0.26)' };
const SERIF = 'Georgia, "Times New Roman", serif';
let T = { cores: PADRAO, fontes: { sans: 'Inter', mono: 'FreeMono' } };

/** guarda o tema usado pelas evidências, painéis e tela */
export function usarTemaEvidencias(tema) {
  T = { cores: { ...PADRAO, ...(tema && tema.cores) }, fontes: { sans: 'Inter', mono: 'FreeMono', ...(tema && tema.fontes) } };
}
/** cor do tema por nome (com fallback) */
export const corDoTema = (nome) => T.cores[nome];
/** fonte do tema: tipo 'sans' | 'mono' */
export const fonteDoTema = (tipo, peso, px) => `${peso} ${px}px ${T.fontes[tipo]}`;

/** mistura duas cores hex (k = 0 → a, 1 → b) */
export function mistura(a, b, k) {
  const rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, (m) => m + m); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join('');
}

/** quebra `texto` em linhas que cabem em maxW com a fonte atual de g */
export function quebrarTexto(g, texto, maxW) {
  const linhas = [];
  for (const p of String(texto).split(/\s+/).filter(Boolean)) {
    const ult = linhas.length ? linhas[linhas.length - 1] : null;
    if (ult !== null && g.measureText(`${ult} ${p}`).width <= maxW) linhas[linhas.length - 1] = `${ult} ${p}`;
    else linhas.push(p);
  }
  return linhas;
}

// ═════════════════════════ PESSOAS sem rosto (só dentro das polaroides) ═════════════════════════
const rad = (d) => (d * Math.PI) / 180;
function corpo(o, cor, cresce) {
  const h = o.h, lw = h * 0.075 + cresce, quadril = [o.x, o.y - h * 0.47], ombro = [o.x, o.y - h * 0.8];
  const perna = (a, k) => { const jo = [quadril[0] + Math.sin(rad(a)) * h * 0.24, quadril[1] + Math.cos(rad(a)) * h * 0.24]; line([quadril, jo, [jo[0] + Math.sin(rad(a - k)) * h * 0.23, jo[1] + Math.cos(rad(a - k)) * h * 0.23]], cor, lw); };
  const braco = (a, e) => { const co = [ombro[0] + Math.sin(rad(a)) * h * 0.18, ombro[1] + h * 0.03 + Math.cos(rad(a)) * h * 0.18]; line([[ombro[0], ombro[1] + h * 0.03], co, [co[0] + Math.sin(rad(a + e)) * h * 0.17, co[1] + Math.cos(rad(a + e)) * h * 0.17]], cor, lw * 0.85); };
  perna(4, 2); braco(-6, 8); perna(-4, 2);
  ctx.beginPath(); ctx.moveTo(ombro[0] - h * 0.11 - cresce / 2, ombro[1]); ctx.lineTo(ombro[0] + h * 0.11 + cresce / 2, ombro[1]); ctx.lineTo(quadril[0] + h * 0.08 + cresce / 2, quadril[1] + h * 0.02); ctx.lineTo(quadril[0] - h * 0.08 - cresce / 2, quadril[1] + h * 0.02); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = h * 0.05 + cresce; ctx.strokeStyle = cor; ctx.stroke();
  line([[ombro[0], ombro[1] - h * 0.02], [ombro[0], ombro[1] - h * 0.06]], cor, h * 0.06 + cresce);
  ell(ombro[0] + h * 0.01, ombro[1] - h * 0.12, h * 0.068 + cresce / 2, h * 0.083 + cresce / 2, cor);
  braco(6, 10);
}
/** silhueta em pé em (x, y): alvo = a pessoa do caso (vermelho aceso); senão escura com contorno de brasa */
function silhueta(x, y, h, alvo) {
  ctx.save();
  if (alvo) { const c = corDoTema('alvo'); ctx.shadowColor = c; ctx.shadowBlur = 50; corpo({ x, y, h }, c, 0); ctx.shadowBlur = 18; corpo({ x, y, h }, c, 0); ctx.shadowBlur = 0; corpo({ x, y, h }, mistura(c, '#FFFFFF', 0.12), -6); }
  else { ctx.shadowColor = corDoTema('brasa'); ctx.shadowBlur = 22; corpo({ x, y, h }, corDoTema('brasa'), 5); ctx.shadowBlur = 0; corpo({ x, y, h }, corDoTema('contorno'), 0); }
  ctx.restore();
}

// ═════════════════════════ EVIDÊNCIAS ═════════════════════════
const TIPOS_POLAROID = ['escuro', 'alvo', 'casa', 'tela', 'vazio'];
/** polaroide com foto escura; tipo 'escuro' | 'alvo' | 'casa' | 'tela' (monitor aceso) | 'vazio' (o lugar sem ninguém) */
export function polaroid(x, y, s = 1, rot = 0, tipo = 'escuro') {
  if (!TIPOS_POLAROID.includes(tipo)) throw new RangeError(`polaroid: tipo desconhecido "${tipo}" (use ${TIPOS_POLAROID.join(', ')})`);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  rr(-120, -140, 240, 280, 4); ctx.fillStyle = corDoTema('papel'); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = NEUTRO.foto; ctx.fillRect(-100, -120, 200, 190);
  ctx.save(); ctx.beginPath(); ctx.rect(-100, -120, 200, 190); ctx.clip();
  if (tipo === 'escuro' || tipo === 'alvo') silhueta(0, 62, 175, tipo === 'alvo');
  if (tipo === 'casa') {
    ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(0, -60); ctx.lineTo(60, 0); ctx.fillStyle = NEUTRO.parede; ctx.fill();
    ctx.fillRect(-50, 0, 100, 60);
    ctx.save(); ctx.shadowColor = corDoTema('luz'); ctx.shadowBlur = 24; ctx.fillStyle = corDoTema('luz'); ctx.fillRect(10, 15, 24, 20); ctx.restore();
  }
  if (tipo === 'tela') {
    const d = corDoTema('destaque');
    ctx.fillStyle = NEUTRO.quarto; ctx.fillRect(-100, 30, 200, 40);                         // a mesa
    ctx.save(); ctx.shadowColor = d; ctx.shadowBlur = 40; rr(-62, -78, 124, 84, 5); ctx.fillStyle = corDoTema('painel'); ctx.fill(); ctx.restore();
    rr(-62, -78, 124, 84, 5); ctx.strokeStyle = NEUTRO.parede; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = d; [70, 46, 88, 30, 60, 76].forEach((lw, i) => ctx.fillRect(-50 + (i % 3 === 1 ? 10 : 0), -66 + i * 11, lw * (i % 3 === 1 ? 0.8 : 1), 5));
    ctx.fillStyle = NEUTRO.parede; ctx.fillRect(-6, 6, 12, 18); ctx.fillRect(-26, 22, 52, 7);   // o pé
  }
  if (tipo === 'vazio') {
    const luz = corDoTema('luz'), g = ctx.createLinearGradient(0, -120, 0, 70); g.addColorStop(0, rgba(luz, 0.16)); g.addColorStop(1, rgba(luz, 0));
    ctx.beginPath(); ctx.moveTo(-14, -120); ctx.lineTo(14, -120); ctx.lineTo(70, 70); ctx.lineTo(-70, 70); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ell(0, 52, 62, 12, rgba(luz, 0.12));
    ctx.fillStyle = corDoTema('luz'); ctx.fillRect(-16, -120, 32, 5);                       // a lâmpada
  }
  ctx.restore();
  ctx.restore();
}

// Moldura do carimbo: 64 px e 340 de largura; texto longo encolhe a fonte e alarga a moldura até 460 (sempre com folga).
const CARIMBO = { px: 64, min: 340, max: 460, folga: 36 };
/** fonte (px) e largura da moldura para o carimbo caber; medir(texto, px) → largura */
export function medidasDoCarimbo(texto, medir) {
  const px = CARIMBO.px * escalaQueCabe(medir(texto, CARIMBO.px), CARIMBO.max - 2 * CARIMBO.folga);
  return { px, largura: clamp(medir(texto, px) + 2 * CARIMBO.folga, CARIMBO.min, CARIMBO.max) };
}
/** pasta do caso com etiqueta datilografada e carimbo vermelho (texto livre) que cai do 1,8× ao 1× com kCarimbo */
export function ficha(x, y, s = 1, rotulo = 'CASO Nº 0000', carimbo = '', kCarimbo = 0, rot = -0.05) {
  const mono = (px) => fonteDoTema('mono', 700, px), pasta = corDoTema('pasta'), tinta = corDoTema('contorno');
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
  rr(-300, -230, 220, 60, 10); ctx.fillStyle = mistura(pasta, '#000000', 0.1); ctx.fill();
  rr(-320, -200, 640, 420, 12); ctx.fillStyle = pasta; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rr(-260, -150, 360, 70, 4); ctx.fillStyle = corDoTema('papel'); ctx.fill();
  ctx.font = mono(36); const fr = escalaQueCabe(ctx.measureText(rotulo).width, 330); ctx.font = mono(36 * fr);
  ctx.fillStyle = tinta; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(rotulo, -245, -113);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = NEUTRO.tinta; ctx.fillRect(-260, -30 + i * 50, 420 - i * 90, 16); }
  if (carimbo && kCarimbo > 0) {
    const m = medidasDoCarimbo(carimbo, (txt, px) => { ctx.font = mono(px); return ctx.measureText(txt).width; });
    const e = lerp(1.8, 1, clamp(kCarimbo)), cx = Math.min(110, 290 - m.largura / 2);
    ctx.save(); ctx.translate(cx, 105); ctx.rotate(-0.2); ctx.scale(e, e); ctx.globalAlpha = clamp(kCarimbo * 2) * 0.9;
    rr(-m.largura / 2, -48, m.largura, 96, 8); ctx.strokeStyle = corDoTema('perigo'); ctx.lineWidth = 9; ctx.stroke();
    ctx.font = mono(m.px); ctx.fillStyle = corDoTema('perigo'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(carimbo, 0, 4);
    ctx.restore();
  }
  ctx.restore();
}

/** folha de papel (bilhete, relatório) com linhas [[texto, tamanho, cor, dy]]; k = escala de entrada 0..1 */
export function papel(x, y, w, h, rot, linhas, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40;
  rr(-w / 2, -h / 2, w, h, 6); ctx.fillStyle = corDoTema('papel'); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (const [txt, tam, cor, dy] of linhas) {
    ctx.font = fonteDoTema('mono', 700, tam); const f = escalaQueCabe(ctx.measureText(txt).width, w - 80);
    ctx.font = fonteDoTema('mono', 700, tam * f); ctx.fillStyle = cor || corDoTema('contorno'); ctx.fillText(txt, -w / 2 + 40, -h / 2 + dy);
  }
  ctx.restore();
}

/** círculo vermelho à mão em volta de (x, y); p 0..1 desenha */
export function circuloVermelho(x, y, rx, ry, p = 1) {
  if (p <= 0) return;
  ctx.beginPath();
  for (let i = 0; i <= 60 * clamp(p); i++) {
    const a = -1.9 + (i / 60) * (TAU + 0.5), k = 1 + 0.05 * Math.sin(i * 0.7);
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.strokeStyle = corDoTema('perigo'); ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
}

/** data datilografada no alto à esquerda: linha 1 grande em `texto`, linha 2 menor em `perigo`; p 0..1 digita (com cursor) */
export function dataDatilografada(linha1, linha2, p = 1, x = 80, y = 300) {
  const l1 = datilografar(linha1, p * 1.6), l2 = datilografar(linha2, p * 1.6 - 0.6);
  const cabe = (txt, px) => { ctx.font = fonteDoTema('mono', 700, px); return px * escalaQueCabe(ctx.measureText(txt).width, W - x - 60); };
  const px1 = cabe(linha1, 92), px2 = cabe(linha2, 56);
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
  ctx.font = fonteDoTema('mono', 700, px1); ctx.fillStyle = corDoTema('texto'); ctx.fillText(l1, x, y);
  ctx.font = fonteDoTema('mono', 700, px2); ctx.fillStyle = corDoTema('perigo'); ctx.fillText(l2, x, y + px2 * 1.36);
  ctx.shadowBlur = 0;
  if (p < 1 && Math.floor(p * 20) % 2 === 0) {
    ctx.fillStyle = corDoTema('texto');
    if (l2) ctx.fillRect(x + ctx.measureText(l2).width + 6, y + px2 * 1.36 - px2 * 0.68, px2 * 0.46, px2 * 0.82);
    else { ctx.font = fonteDoTema('mono', 700, px1); ctx.fillRect(x + ctx.measureText(l1).width + 6, y - px1 * 0.7, px1 * 0.28, px1 * 0.7); }
  }
  ctx.restore();
}

/** tarjas pretas sobre linhas de texto (o documento censurado); p 0..1 passa as tarjas */
export function tarjas(x, y, larguras, p = 1) {
  larguras.forEach((w, i) => { ctx.fillStyle = corDoTema('contorno'); ctx.fillRect(x, y + i * 60, w * clamp(p * 2 - i * 0.3), 36); });
}
/** plaquinha amarela de evidência com o número n */
export function marcador(x, y, s, n) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-40, -110); ctx.lineTo(40, -110); ctx.lineTo(60, 0); ctx.closePath(); ctx.fillStyle = corDoTema('fita'); ctx.fill();
  ctx.shadowBlur = 0; ctx.font = fonteDoTema('sans', 900, 70); ctx.fillStyle = corDoTema('contorno'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, -52);
  ctx.restore();
}
/** relógio de parede marcando hh:mm */
export function relogio(x, y, s, hh, mm) {
  const tinta = corDoTema('contorno');
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); circle(0, 0, 150, NEUTRO.aro); circle(0, 0, 130, corDoTema('papel'));
  for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 6); ctx.fillStyle = tinta; ctx.fillRect(-4, -122, 8, i % 3 ? 14 : 26); ctx.restore(); }
  ctx.save(); ctx.rotate((((hh % 12) + mm / 60) * Math.PI) / 6); ctx.fillStyle = tinta; ctx.fillRect(-7, -70, 14, 80); ctx.restore();
  ctx.save(); ctx.rotate((mm * Math.PI) / 30); ctx.fillStyle = tinta; ctx.fillRect(-5, -108, 10, 118); ctx.restore();
  circle(0, 0, 10, tinta);
  ctx.restore();
}

// ═════════════════════════ RECORTE DE JORNAL ═════════════════════════
/** contorno rasgado de um retângulo w×h centrado em 0: serrilhado de ~14 px com ruído de semente fixa (±8 px) */
export function bordaRasgada(w, h, semente = 1) {
  const pts = [], amp = 8, passo = 14;
  const lado = (x0, y0, x1, y1, nx, ny, base) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / passo));
    for (let i = 0; i < n; i++) {
      const q = i / n, d = (rnd(semente * 1009 + base + i) - 0.5) * 2 * amp * (i % 2 ? 1 : 0.45);
      pts.push([lerp(x0, x1, q) + nx * d, lerp(y0, y1, q) + ny * d]);
    }
  };
  lado(-w / 2, -h / 2, w / 2, -h / 2, 0, 1, 0); lado(w / 2, -h / 2, w / 2, h / 2, 1, 0, 300);
  lado(w / 2, h / 2, -w / 2, h / 2, 0, 1, 600); lado(-w / 2, h / 2, -w / 2, -h / 2, 1, 0, 900);
  return pts;
}
const sementeDe = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

/**
 * recorte de jornal amarelado: nome do jornal em serif, data, manchete em sans pesada, subtítulo e 3 colunas de texto
 * em linhas cinza. k 0..1: entra girando e caindo. O nome é genérico (nunca imite um jornal real).
 */
export function recorteDeJornal(x, y, s, rot, { titulo, subtitulo = '', jornal = 'NOTÍCIAS', data = '' }, k = 1) {
  if (k <= 0) return;
  const e = eo(clamp(k)), w = 640, h = 760, tinta = corDoTema('contorno'), top = -h / 2;
  ctx.save(); ctx.globalAlpha = clamp(k * 3);
  ctx.translate(x, y - (1 - e) * 260); ctx.rotate(rot + (1 - e) * 0.55); ctx.scale(s * lerp(1.12, 1, e), s * lerp(1.12, 1, e));
  // papel amarelado de borda rasgada, com sombra e cantos envelhecidos
  const borda = bordaRasgada(w, h, sementeDe(titulo));
  const contorno = () => { ctx.beginPath(); borda.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); };
  ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 12;
  contorno(); ctx.fillStyle = mistura(corDoTema('papel'), corDoTema('fita'), 0.28); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const vel = ctx.createRadialGradient(0, 0, 160, 0, 0, 520); vel.addColorStop(0, 'rgba(120,80,20,0)'); vel.addColorStop(1, 'rgba(120,80,20,0.32)');
  contorno(); ctx.fillStyle = vel; ctx.fill();
  ctx.fillStyle = tinta; ctx.strokeStyle = tinta; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // cabeçalho: nome do jornal, filetes e a data
  ctx.font = `700 64px ${SERIF}`; const fj = escalaQueCabe(ctx.measureText(jornal).width, w - 80); ctx.font = `700 ${64 * fj}px ${SERIF}`;
  ctx.fillText(jornal, 0, top + 92);
  ctx.fillRect(-w / 2 + 34, top + 116, w - 68, 4); ctx.fillRect(-w / 2 + 34, top + 124, w - 68, 1.5);
  if (data) { ctx.font = fonteDoTema('mono', 700, 24); ctx.fillText(data, 0, top + 154); }
  ctx.fillRect(-w / 2 + 34, top + 168, w - 68, 1.5);
  // manchete: até 3 linhas que cabem na largura (encolhe se precisar)
  let px = 76, linhas;
  for (;; px -= 4) { ctx.font = fonteDoTema('sans', 900, px); linhas = quebrarTexto(ctx, titulo, w - 70); if ((linhas.length <= 3 && linhas.every((l) => ctx.measureText(l).width <= w - 70)) || px <= 36) break; }
  let yy = top + 186 + px * 0.92;
  for (const l of linhas) { ctx.fillText(l, 0, yy); yy += px * 1.02; }
  if (subtitulo) {
    ctx.font = `italic 400 30px ${SERIF}`;
    for (const l of quebrarTexto(ctx, subtitulo, w - 90).slice(0, 2)) { yy += 4; ctx.fillText(l, 0, yy); yy += 34; }
  }
  // 3 colunas de "texto" em linhas cinza, até o pé do recorte
  yy += 18; ctx.fillRect(-w / 2 + 34, yy - 14, w - 68, 1.5);
  const cw = (w - 68 - 2 * 22) / 3, sem = sementeDe(titulo);
  for (let c = 0; c < 3; c++) {
    const cx = -w / 2 + 34 + c * (cw + 22);
    for (let i = 0, ly = yy + 6; ly < h / 2 - 30; i++, ly += 24) {
      const fimDeParagrafo = rnd(sem + c * 97 + i) < 0.14, lw = fimDeParagrafo ? cw * (0.35 + 0.4 * rnd(sem + c * 31 + i)) : cw;
      ctx.fillStyle = NEUTRO.tinta; ctx.fillRect(cx, ly, lw, 9);
    }
  }
  ctx.restore();
}

// ═════════════════════════ FILME (por último, antes das legendas) ═════════════════════════
/** vinheta + grão de filme; o grão troca 24 vezes por segundo e é função de t */
export function filme(t, vinheta = 0.75) {
  const g = ctx.createRadialGradient(540, 900, 300, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vinheta})`);
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  const f = Math.floor(t * 24);
  for (let i = 0; i < 900; i++) { ctx.fillStyle = rnd(i + f * 13) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(rnd(i * 3 + f) * W, rnd(i * 7 + f * 2) * H, 3, 3); }
}
