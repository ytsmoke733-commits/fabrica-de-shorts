// Balão de pensamento 2D (canvas), porte de engolir-chiclete-v2/src/shots.js 25-54 (redX, cloudPath, bubble, arrowDown):
//   balaoPensamento(img, cx, cy, rx, ry, k, de, t, estouro)   nuvem com uma imagem dentro, rastro de 3 bolinhas saindo da cabeça `de`
//   xVermelho(x, y, tam, k)                                    X branco com miolo vermelho (cor `perigo` do tema)
//   setaBaixo(x, y, k)                                         seta ciano para baixo
//   pedacosDoEstouro(n, seed)                                  puro: os pedaços do estouro [{ ang, vel, giro }]
// `img` é um canvas/imagem 1080×1920 que o chamador preenche NO MESMO quadro (grave o 3D de outra cena e use já): nada aqui guarda
// estado entre quadros, então todo quadro continua sendo função pura de t.
import { ctx, W, H, TAU, clamp, lerp, eob, rnd } from './motor/lib.js';

let PERIGO = '#D62839';
/** guarda a cor `perigo` do tema para o xVermelho (chame junto do usarTema do hud) */
export function usarTemaBalao(tema) { PERIGO = tema?.cores?.perigo || PERIGO; }

/** os pedaços do estouro: ângulos espalhados pela volta (com folga aleatória), alcance 180-340, giro/tamanho 0-1 */
export function pedacosDoEstouro(n = 14, seed = 1) {
  return Array.from({ length: n }, (_, i) => ({
    ang: i / n * TAU + rnd(i + seed * 101),
    vel: 180 + rnd(i + 4 + seed * 101) * 160,
    giro: rnd(i + 9 + seed * 101),
  }));
}

export function xVermelho(x, y, tam, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.translate(x, y); ctx.scale(tam, tam); ctx.lineCap = 'round';
  for (const [w, c] of [[86, '#FFFFFF'], [58, PERIGO]]) {
    ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath();
    ctx.moveTo(-150, -150); ctx.lineTo(150, 150); ctx.moveTo(150, -150); ctx.lineTo(-150, 150); ctx.stroke();
  }
  ctx.restore();
}

function caminhoNuvem(cx, cy, rx, ry, ondula = 0) {
  ctx.beginPath(); const N = 11;
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, r = (i % 2 ? 0.34 : 0.4) * Math.min(rx, ry) * (1 + 0.03 * Math.sin(ondula + i));
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
  }
  ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
}

/** balão em (cx, cy) com `img` dentro; k = crescer 0..1; de = [x, y] da cabeça; estouro 0..1 solta os pedaços */
export function balaoPensamento(img, cx, cy, rx, ry, k, de, t, estouro = 0) {
  if (k <= 0 || estouro >= 1) return;
  ctx.save();
  const s = eob(clamp(k)), a = 1 - estouro;
  for (let i = 0; i < 3; i++) {                                   // rastro de bolinhas saindo da cabeça
    const u = (i + 1) / 4, kk = clamp(k * 3 - i * 0.4); if (kk <= 0) continue;
    const x = lerp(de[0], cx - rx * 0.5, u), y = lerp(de[1], cy + ry * 0.75, u);
    ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, (10 + i * 9) * kk, 0, TAU); ctx.fill();
  }
  if (estouro > 0) {                                              // os pedaços voam
    for (const p of pedacosDoEstouro()) {
      const d = estouro * p.vel, x = cx + Math.cos(p.ang) * (rx * 0.7 + d), y = cy + Math.sin(p.ang) * (ry * 0.7 + d) + estouro * estouro * 200;
      const r = (26 + p.giro * 30) * (1 - estouro);
      ctx.globalAlpha = 1 - estouro; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'transparent'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore(); return;
  }
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fillStyle = '#FFFFFF'; caminhoNuvem(cx, cy, rx, ry, t * 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.92, ry * 0.88, 0, 0, TAU); ctx.clip();
  const iw = rx * 1.75, ih = iw * H / W; ctx.drawImage(img, cx - iw / 2, cy - ih * 0.5, iw, ih); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.92, ry * 0.88, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}

export function setaBaixo(x, y, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(x, y); ctx.fillStyle = '#4FD1E8'; ctx.strokeStyle = '#0B1220'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(-22, -70); ctx.lineTo(22, -70); ctx.lineTo(22, 0); ctx.lineTo(50, 0); ctx.lineTo(0, 60); ctx.lineTo(-50, 0); ctx.lineTo(-22, 0); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.restore();
}
