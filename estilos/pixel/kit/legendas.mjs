// Legendas do pixel: 1-3 palavras na fonte pixel 5x7 (kit/pixelfonte.mjs), CAIXA ALTA, contorno escuro e UMA palavra em destaque.
// Agrupamento e regra de números iguais ao kit motion (gruposDaLinha copiada de estilos/motion/kit/legendas.mjs).
import { norm } from './tempo.mjs';
import { lerNumero, formatarNumeroLegenda, ehNumeroPorExtenso, ehEscala, ehEscalaPlural, FECHA } from './numeros.mjs';
import { linhaPixel, larguraTexto } from './pixelfonte.mjs';

export const LEGENDA = { y: 1430, s: 7, maxW: 940 };
const r3 = (x) => Math.round(x * 1000) / 1000;
const palavrasDe = (s) => s.trim().split(/\s+/).filter((p) => norm(p.replace(/^\*/, '')));

// Devolve grupos de tokens { txt, key, fal } a partir de `caps` ('Seu *coração | bate') ou do texto puro.
// `fal` = índice da palavra FALADA que dá o tempo do token. Números aparecem sempre em algarismos:
// nas caps o roteirista escreve "*36 milhões" (casa com "trinta e seis milhões" falado, mesmo valor);
// sem caps, o número falado por extenso é convertido ("cem mil" -> "100 mil") e vira o destaque do bloco.
function gruposDaLinha(l, i, faladas) {
  if (l.caps) {
    const blocos = l.caps.split('|').map((g) => g.trim()).filter((g) => palavrasDe(g).length);
    for (const b of blocos) {
      const estrelas = palavrasDe(b).filter((p) => p.startsWith('*')).length;
      if (estrelas !== 1) throw new Error(`legenda da linha ${i}: bloco "${b}" precisa de exatamente uma palavra com *`);
    }
    const grupos = blocos.map((g) => palavrasDe(g).map((p) => (p.startsWith('*') ? { txt: p.slice(1), key: true } : { txt: p, key: false })));
    const plano = grupos.flat();
    let pos = 0;
    for (let c = 0; c < plano.length; c++) {
      const tk = plano[c];
      if (/\d/.test(tk.txt)) {
        // algarismo (+ escala logo depois: "36 milhões") precisa ter o mesmo valor do número falado nessa posição
        const grupo = [tk];
        if (!FECHA.test(tk.txt) && c + 1 < plano.length && ehEscala(plano[c + 1].txt)) grupo.push(plano[c + 1]);
        const vc = lerNumero(grupo.map((g) => g.txt), 0);
        const vf = lerNumero(faladas, pos, { um: true });
        if (vf && !!vf.pct !== tk.txt.endsWith('%')) throw new Error(`legenda da linha ${i}: "${tk.txt}" não bate com o falado "${faladas.slice(pos, pos + vf.n).join(' ')}" (use % só com "por cento")`);
        if (!vc || !vf || vf.valor !== vc.valor) throw new Error(`legenda da linha ${i}: "${grupo.map((g) => g.txt).join(' ')}" não bate com o falado "${faladas.slice(pos, pos + (vf ? vf.n : 1)).join(' ')}"`);
        grupo[0].fal = pos;
        if (grupo[1]) grupo[1].fal = pos; // o número entra inteiro ("36 milhões") na 1ª palavra falada dele
        pos += vf.n; c += grupo.length - 1;
        continue;
      }
      const n = norm(tk.txt);
      if (ehNumeroPorExtenso(tk.txt) && n !== 'um' && n !== 'uma' && !ehEscalaPlural(tk.txt)) throw new Error(`legenda da linha ${i}: "${tk.txt}" por extenso nas caps — use algarismos`);
      if (pos >= faladas.length || n !== norm(faladas[pos])) throw new Error(`legenda da linha ${i}: caps não batem com o texto falado`);
      tk.fal = pos++;
    }
    if (pos !== faladas.length) throw new Error(`legenda da linha ${i}: caps não batem com o texto falado`);
    return grupos;
  }
  // sem caps: converte números e fatia em blocos de até 3 tokens sem partir um número ao meio
  const toks = [];
  for (let pos = 0, g = 0; pos < faladas.length; g++) {
    const r = lerNumero(faladas, pos);
    if (r) { formatarNumeroLegenda(r.valor, r.pct).forEach((txt) => toks.push({ txt, num: true, grp: g, fal: pos })); pos += r.n; }
    else toks.push({ txt: faladas[pos], grp: g, fal: pos++ });
  }
  const grupos = [];
  for (let k = 0; k < toks.length;) {
    let fim = Math.min(k + 3, toks.length);
    if (fim < toks.length && fim - k > 1 && toks[fim].grp === toks[fim - 1].grp) fim--;
    const bloco = toks.slice(k, fim);
    const num = bloco.findIndex((t) => t.num);
    const destaque = num >= 0 ? num : bloco.reduce((m, t, j) => (norm(t.txt).length > norm(bloco[m].txt).length ? j : m), 0);
    grupos.push(bloco.map((t, j) => ({ txt: t.txt, key: j === destaque, fal: t.fal })));
    k = fim;
  }
  return grupos;
}

export function planejarLegendas(tempo, linhas) {
  const blocos = [];
  linhas.forEach((l, i) => {
    const faladas = palavrasDe(l.text);
    const cont = {};
    const occ = faladas.map((f) => { const nf = norm(f); cont[nf] = (cont[nf] || 0) + 1; return cont[nf]; });
    for (const g of gruposDaLinha(l, i, faladas)) {
      const f0 = g[0].fal;
      blocos.push({ linha: i, s: r3(tempo.palavra(faladas[f0], i, occ[f0]) - 0.05), palavras: g.map((tk) => ({ txt: tk.txt.toLocaleUpperCase('pt-BR'), hi: !!tk.key })) });
    }
  });
  blocos.forEach((b, k) => {
    const prox = blocos[k + 1], fim = tempo.fimLinha(b.linha);
    b.e = prox ? (prox.linha !== b.linha && prox.s - fim > 0.7 ? r3(fim + 0.35) : prox.s) : tempo.duracao;
  });
  return blocos;
}

// Desenha o bloco ativo em t na fonte pixel (canvas 1080 de largura). Entra com um "pulo" de 1 pixel da fonte.
// Sem teste automático: é canvas. y = topo das maiúsculas; s = tamanho do pixel da fonte (encolhe até caber em maxW).
export function desenharLegenda(lista, t, tema, { y = LEGENDA.y, s = LEGENDA.s, maxW = LEGENDA.maxW } = LEGENDA) {
  const c = lista.find((b) => t >= b.s && t < b.e); if (!c) return;
  const partes = c.palavras.map((p) => ({ txt: p.txt, cor: p.hi ? tema.cores.destaque : tema.cores.texto }));
  const larg = (sz) => partes.reduce((a, p) => a + larguraTexto(p.txt, sz), 0) + 4 * sz * (partes.length - 1);
  while (s > 4 && larg(s) > maxW) s--;
  const pulo = t - c.s < 0.07 ? s : 0;
  linhaPixel(partes, 540, y - pulo, { s, contorno: tema.cores.contorno });
}
