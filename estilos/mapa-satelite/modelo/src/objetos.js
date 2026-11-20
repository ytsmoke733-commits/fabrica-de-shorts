// Objetos planos estilo cartoon por cima do mapa de satélite (canvas 2D): cartões, carimbos, martelo de leilão, gráfico de
// barras, barra de progresso, placa de estação e banco com teia. Contorno escuro grosso + sombra dura deslocada.
// Tudo é função pura dos parâmetros (k = entrada 0..1, t = segundos para o que balança); nada guarda estado.
import { clamp, eo, eob, TAU } from '../kit/motor/lib.js';

export const TINTA = '#0B1220', CREME = '#FFF4DC', OURO = '#FFC94A', VERMELHO = '#E5383B', VERDE = '#3DFF7A';
export const AZUL = '#2B59C3', DINHEIRO = '#2E9E5B', MADEIRA = '#9A5B2E', MADEIRA2 = '#6E3F1E';

/** origem em (x, y), entrada com rebote (escala s0 → 1) e alfa rápido; rot em rad */
function entrar(g, x, y, k, rot = 0, s0 = 0.35) {
  const s = s0 + (1 - s0) * eob(clamp(k));
  g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.globalAlpha *= clamp(k * 2.5);
}

/** retângulo cartoon: sombra dura + preenchimento + contorno grosso */
export function caixa(g, x, y, w, h, { r = 26, fundo = CREME, borda = TINTA, lw = 7, sombra = 10 } = {}) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.roundRect(x + sombra, y + sombra, w, h, r); g.fill();
  g.fillStyle = fundo; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
  if (lw > 0) { g.lineWidth = lw; g.strokeStyle = borda; g.lineJoin = 'round'; g.stroke(); }
  g.restore();
}

/** texto em Inter (900 por padrão) que encolhe para caber em maxW */
export function texto(g, txt, x, y, { tam = 64, cor = TINTA, peso = 900, alinhar = 'center', maxW = 0, contorno = 0, corContorno = TINTA } = {}) {
  g.font = `${peso} ${tam}px Inter, sans-serif`;
  if (maxW) { const w = g.measureText(txt).width; if (w > maxW) g.font = `${peso} ${(tam * maxW) / w}px Inter, sans-serif`; }
  g.textAlign = alinhar; g.textBaseline = 'middle';
  if (contorno) { g.lineJoin = 'round'; g.lineWidth = contorno; g.strokeStyle = corContorno; g.strokeText(txt, x, y); }
  g.fillStyle = cor; g.fillText(txt, x, y);
}

/** carimbo que "bate": k 0..1 (escala 2,2 → 1 com alfa), moldura dupla, tinta levemente translúcida */
export function carimbo(g, x, y, txt, { k = 1, rot = -0.18, cor = VERMELHO, tam = 86, fundo = null } = {}) {
  if (k <= 0) return;
  const e = eo(clamp(k));
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(1 + 1.2 * (1 - e), 1 + 1.2 * (1 - e));
  g.globalAlpha *= clamp(k * 3) * 0.94;
  g.font = `900 ${tam}px Inter, sans-serif`;
  const w = g.measureText(txt).width + tam * 0.9, h = tam * 1.55;
  if (fundo) { g.fillStyle = fundo; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, tam * 0.18); g.fill(); }
  g.strokeStyle = cor; g.lineJoin = 'round';
  g.lineWidth = tam * 0.11; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, tam * 0.18); g.stroke();
  g.lineWidth = tam * 0.04; g.beginPath(); g.roundRect(-w / 2 + tam * 0.16, -h / 2 + tam * 0.16, w - tam * 0.32, h - tam * 0.32, tam * 0.1); g.stroke();
  g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, tam * 0.04);
  g.restore();
}

/** cartão do plano de 1981 (planta azul): linhas aparecem por kLinha2 / kLinha3 */
export function cartaoPlano(g, x, y, { k = 1, kMeta = 0 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k, -0.03);
  caixa(g, -400, -125, 800, 250, { fundo: '#1D3F72', borda: '#FFFFFF', lw: 6 });
  g.save(); g.beginPath(); g.roundRect(-400, -125, 800, 250, 26); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
  for (let i = -400; i <= 400; i += 40) { g.beginPath(); g.moveTo(i, -125); g.lineTo(i, 125); g.stroke(); }
  for (let j = -125; j <= 125; j += 40) { g.beginPath(); g.moveTo(-400, j); g.lineTo(400, j); g.stroke(); }
  g.restore();
  texto(g, 'PLANO DE 1981', 0, -58, { tam: 70, cor: '#FFFFFF', maxW: 720 });
  texto(g, 'LINHA ATÉ O BARREIRO', 0, 18, { tam: 46, cor: OURO, peso: 800, maxW: 720 });
  if (kMeta > 0) {
    g.save(); g.globalAlpha *= clamp(kMeta * 2);
    const s = 0.6 + 0.4 * eob(clamp(kMeta));
    g.translate(0, 82); g.scale(s, s);
    texto(g, 'PRONTA EM 1986', 0, 0, { tam: 46, cor: '#FFFFFF', peso: 800 });
    g.restore();
  }
  g.restore();
}

/** documento de empréstimo (papel com linhas) */
export function documento(g, x, y, { k = 1 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k, 0.04);
  caixa(g, -260, -170, 520, 340, { r: 14, fundo: '#FFFDF6' });
  texto(g, 'EMPRÉSTIMO', 0, -112, { tam: 52 });
  g.fillStyle = 'rgba(11,18,32,0.22)';
  [[-200, -50, 400], [-200, -10, 340], [-200, 30, 380], [-200, 70, 250]].forEach(([a, b, w]) => { g.beginPath(); g.roundRect(a, b, w, 14, 7); g.fill(); });
  g.strokeStyle = TINTA; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(40, 130); g.bezierCurveTo(70, 100, 90, 150, 120, 118); g.bezierCurveTo(140, 100, 160, 140, 200, 120); g.stroke();
  g.restore();
}

/** barra de progresso das obras: p 0..1, parou 0..1 (fica vermelha) */
export function barraObras(g, x, y, p, { k = 1, parou = 0 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k);
  caixa(g, -400, -105, 800, 210);
  texto(g, 'OBRAS DA LINHA 2', -360, -52, { tam: 46, alinhar: 'left', maxW: 470 });
  const pct = `${Math.round(p * 100)}%`;
  texto(g, pct, 360, -52, { tam: 58, alinhar: 'right', cor: parou > 0.5 ? VERMELHO : TINTA });
  const bx = -360, by = 10, bw = 720, bh = 58;
  g.fillStyle = '#D9D2C2'; g.beginPath(); g.roundRect(bx, by, bw, bh, 29); g.fill();
  if (p > 0) {
    g.save(); g.beginPath(); g.roundRect(bx, by, Math.max(bh, bw * p), bh, 29); g.clip();
    g.fillStyle = parou > 0 ? mistura(OURO, VERMELHO, parou) : OURO; g.fillRect(bx, by, bw, bh);
    g.fillStyle = 'rgba(11,18,32,0.22)';                       // listras de obra
    for (let i = -2; i < 26; i++) { g.beginPath(); g.moveTo(bx + i * 34, by + bh); g.lineTo(bx + i * 34 + 17, by + bh); g.lineTo(bx + i * 34 + 17 + bh * 0.6, by); g.lineTo(bx + i * 34 + bh * 0.6, by); g.fill(); }
    g.restore();
  }
  g.lineWidth = 6; g.strokeStyle = TINTA; g.beginPath(); g.roundRect(bx, by, bw, bh, 29); g.stroke();
  g.restore();
}

/** cartão de dinheiro anunciado */
export function cartaoAnuncio(g, x, y, { k = 1, kValor = 1 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k, -0.025);
  caixa(g, -400, -165, 800, 330);
  nota(g, -335, -20, -0.25, kValor); nota(g, 335, -20, 0.25, kValor);
  g.save(); g.globalAlpha *= clamp(kValor * 2); const s = 0.5 + 0.5 * eob(clamp(kValor)); g.translate(0, -38); g.scale(s, s);
  texto(g, 'R$ 3 BI', 0, 0, { tam: 128, cor: DINHEIRO, contorno: 12 , corContorno: TINTA });
  g.restore();
  texto(g, 'ANUNCIADOS', 0, 95, { tam: 62 });
  g.restore();
}

/** nota de dinheiro pequena (decoração) */
function nota(g, x, y, rot, k) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= clamp(k * 2);
  caixa(g, -55, -32, 110, 64, { r: 8, fundo: '#8FD19E', lw: 5, sombra: 5 });
  g.strokeStyle = TINTA; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.stroke();
  texto(g, '$', 0, 2, { tam: 28 });
  g.restore();
}

/** cartão do leilão: "1 LANCE" e o valor (kValor) */
export function cartaoLeilao(g, x, y, { k = 1, kValor = 0 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k, 0.02);
  caixa(g, -400, -140, 800, 280);
  g.fillStyle = TINTA; g.beginPath(); g.roundRect(-150, -170, 300, 64, 32); g.fill();
  texto(g, 'LEILÃO', 0, -138, { tam: 40, cor: OURO });
  texto(g, '1 LANCE', 0, -35, { tam: 104 });
  if (kValor > 0) {
    g.save(); g.globalAlpha *= clamp(kValor * 2); const s = 0.6 + 0.4 * eob(clamp(kValor)); g.translate(0, 72); g.scale(s, s);
    texto(g, '~R$ 26 MI', 0, 0, { tam: 78, cor: DINHEIRO });
    g.restore();
  }
  g.restore();
}

/** martelo de leilão: pivô no fim do cabo (x, y); ang 0 = batendo no bloco; impacto 0..1 = traços do golpe */
export function martelo(g, x, y, ang, { k = 1, impacto = 0 } = {}) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.globalAlpha *= clamp(k * 2.5);
  const s = 0.5 + 0.5 * eob(clamp(k)); g.scale(s, s);
  // bloco de som
  caixa(g, -410, 92, 220, 52, { r: 12, fundo: MADEIRA2, lw: 6, sombra: 8 });
  if (impacto > 0 && impacto < 1) {
    g.save(); g.globalAlpha *= 1 - impacto; g.strokeStyle = '#FFFFFF'; g.lineWidth = 8; g.lineCap = 'round';
    const r0 = 120 + 70 * impacto;
    for (const a of [-2.6, -2.2, -1.0, -0.55]) { g.beginPath(); g.moveTo(-300 + Math.cos(a) * r0, 92 + Math.sin(a) * r0 * 0.7); g.lineTo(-300 + Math.cos(a) * (r0 + 50), 92 + Math.sin(a) * (r0 + 50) * 0.7); g.stroke(); }
    g.restore();
  }
  g.rotate(ang);
  caixa(g, -300, -13, 300, 26, { r: 13, fundo: MADEIRA, lw: 5, sombra: 6 });          // cabo
  caixa(g, -350, -85, 100, 170, { r: 22, fundo: MADEIRA, lw: 6, sombra: 8 });         // cabeça
  g.fillStyle = MADEIRA2; g.fillRect(-347, -48, 94, 14); g.fillRect(-347, 34, 94, 14);  // faixas
  g.strokeStyle = TINTA; g.lineWidth = 6; g.beginPath(); g.roundRect(-350, -85, 100, 170, 22); g.stroke();
  g.restore();
}

/** gráfico "de cada R$ 100": barras 86 / 14 crescendo por kb */
export function graficoCem(g, x, y, { k = 1, kb = 0 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k);
  caixa(g, -420, -230, 840, 460);
  texto(g, 'DE CADA R$ 100', 0, -160, { tam: 66 });
  const linha = (yy, rot, v, cor) => {
    texto(g, rot, -380, yy - 52, { tam: 40, alinhar: 'left', peso: 800 });
    const bw = 560 * (v / 100) * eo(clamp(kb));
    g.fillStyle = '#E4DDCD'; g.beginPath(); g.roundRect(-380, yy - 22, 560, 64, 14); g.fill();
    if (bw > 2) { g.fillStyle = cor; g.beginPath(); g.roundRect(-380, yy - 22, bw, 64, 14); g.fill(); }
    g.lineWidth = 5; g.strokeStyle = TINTA; g.beginPath(); g.roundRect(-380, yy - 22, 560, 64, 14); g.stroke();
    texto(g, `R$ ${Math.round(v * eo(clamp(kb)))}`, 380, yy + 10, { tam: 64, alinhar: 'right', cor: TINTA });
  };
  linha(-30, 'DINHEIRO PÚBLICO', 86, OURO);
  linha(130, 'EMPRESA', 14, '#4FB3D9');
  g.restore();
}

/** placa de estação com dois postes + banco vazio com teia de aranha (teia 0..1 vai sendo tecida; t balança a aranha) */
export function estacaoVazia(g, x, y, { k = 1, kBanco = 0, teia = 0, t = 0, nome = 'BARREIRO', escala = 1 } = {}) {
  if (k <= 0) return;
  g.save(); entrar(g, x, y, k, 0, 0.6); g.scale(escala, escala);
  // postes e placa
  caixa(g, -250, -150, 22, 300, { r: 6, fundo: '#5B6573', lw: 5, sombra: 6 });
  caixa(g, 228, -150, 22, 300, { r: 6, fundo: '#5B6573', lw: 5, sombra: 6 });
  caixa(g, -330, -250, 660, 150, { r: 18, fundo: '#16305C', borda: TINTA, lw: 7 });
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.beginPath(); g.roundRect(-316, -236, 632, 122, 12); g.stroke();
  g.fillStyle = OURO; g.beginPath(); g.arc(-245, -175, 42, 0, TAU); g.fill(); g.lineWidth = 5; g.strokeStyle = TINTA; g.stroke();
  texto(g, 'M', -245, -173, { tam: 52 });
  texto(g, nome, 40, -173, { tam: 76, cor: '#FFFFFF', maxW: 470 });
  // banco
  if (kBanco > 0) {
    g.save(); g.globalAlpha *= clamp(kBanco * 2.5); g.translate(0, 210 - 40 * (1 - eo(clamp(kBanco))));
    caixa(g, -200, 20, 18, 70, { r: 4, fundo: '#4A5260', lw: 4, sombra: 4 });
    caixa(g, 182, 20, 18, 70, { r: 4, fundo: '#4A5260', lw: 4, sombra: 4 });
    caixa(g, -230, -10, 460, 34, { r: 8, fundo: MADEIRA, lw: 5, sombra: 6 });                 // assento
    caixa(g, -230, -110, 460, 30, { r: 8, fundo: MADEIRA, lw: 5, sombra: 6 });                // encosto
    caixa(g, -230, -66, 460, 30, { r: 8, fundo: MADEIRA, lw: 5, sombra: 6 });
    caixa(g, -214, -110, 16, 104, { r: 4, fundo: '#4A5260', lw: 4, sombra: 0 });
    caixa(g, 198, -110, 16, 104, { r: 4, fundo: '#4A5260', lw: 4, sombra: 0 });
    if (teia > 0) teiaNoCanto(g, 214, -110, teia, t);
    g.restore();
  }
  g.restore();
}

/** teia num canto (x0, y0) abrindo para baixo-esquerda, tecida por p (0..1); aranha pendurada balançando com t */
function teiaNoCanto(g, x0, y0, p, t) {
  g.save();
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 2.6; g.lineCap = 'round';
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 3;
  const R = 150, raios = 6, a0 = Math.PI / 2, a1 = Math.PI;                 // quadrante de baixo-esquerda
  const pr = clamp(p / 0.4);
  for (let i = 0; i < raios; i++) {
    const a = a0 + ((a1 - a0) * i) / (raios - 1), r = R * pr;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r); g.stroke();
  }
  const voltas = 6, pv = clamp((p - 0.3) / 0.6);
  for (let v = 1; v <= voltas; v++) {
    if (v / voltas > pv + 1e-6) break;
    const r = (R * v) / (voltas + 0.5);
    g.beginPath();
    for (let i = 0; i < raios; i++) {
      const a = a0 + ((a1 - a0) * i) / (raios - 1), rr = r * (i % 2 ? 0.93 : 1);
      const px = x0 + Math.cos(a) * rr, py = y0 + Math.sin(a) * rr;
      if (i) g.quadraticCurveTo(x0 + Math.cos(a - 0.15) * rr * 0.86, y0 + Math.sin(a - 0.15) * rr * 0.86, px, py); else g.moveTo(px, py);
    }
    g.stroke();
  }
  const pa = clamp((p - 0.8) / 0.2);
  if (pa > 0) {                                                             // aranha descendo pelo fio
    const sw = Math.sin(t * 2.4) * 0.12, fio = 40 + 90 * eo(pa);
    const ax = x0 - 70 + Math.sin(sw) * fio, ay = y0 + Math.cos(sw) * fio;
    g.beginPath(); g.moveTo(x0 - 70, y0); g.lineTo(ax, ay); g.stroke();
    g.shadowBlur = 0; g.fillStyle = '#111'; g.strokeStyle = '#111'; g.lineWidth = 3;
    for (const s of [-1, 1]) for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(ax, ay + 4); g.lineTo(ax + s * (14 + j * 2), ay - 6 + j * 7); g.lineTo(ax + s * (20 + j * 2), ay + 2 + j * 9); g.stroke(); }
    g.beginPath(); g.arc(ax, ay + 6, 11, 0, TAU); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(ax - 4, ay + 3, 2.5, 0, TAU); g.arc(ax + 4, ay + 3, 2.5, 0, TAU); g.fill();
  }
  g.restore();
}

/** mistura de duas cores #rrggbb */
export function mistura(a, b, k) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
