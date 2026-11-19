// Legendas do kit motion: palavra a palavra, uma palavra em serif itálica (--acento) por grupo.
// Extraído de teste-motion-v2/gen.mjs (526-582); tempos vêm do objeto `tempo`, nunca de índice global.
import { cena } from './base.mjs';
import { norm } from './tempo.mjs';
import { lerNumero, formatarNumeroLegenda, ehNumeroPorExtenso, ehEscala, ehEscalaPlural, FECHA } from './numeros.mjs';

const r2 = (x) => Math.round(x * 1000) / 1000;
// descarta tokens sem letra/algarismo ("—", "...", "+"): a voz não os fala e o words.py também os descarta
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

export function legendas(tempo, linhas, opcoes = {}) {
  const caixa = new Set((opcoes.caixa || []).map(norm));
  const perigo = new Set((opcoes.perigo || []).map(norm));
  const y = opcoes.y ?? 1240;
  const DUR = opcoes.duracao ?? tempo.duracao;

  // 1) resolve grupos e tempos de cada palavra (ocorrência contada por linha)
  const G = [];
  linhas.forEach((l, i) => {
    const faladas = palavrasDe(l.text);
    // ocorrência de cada palavra falada dentro da linha ("não, não é" -> 1ª e 2ª)
    const cont = {};
    const occ = faladas.map((f) => { const nf = norm(f); cont[nf] = (cont[nf] || 0) + 1; return cont[nf]; });
    gruposDaLinha(l, i, faladas).forEach((toks) => {
      G.push(toks.map((tk) => {
        // o tempo vem da palavra FALADA (o token exibido pode ser um algarismo)
        const falada = faladas[tk.fal], nf = norm(falada), oc = occ[tk.fal];
        const n = norm(tk.txt);
        return { txt: tk.txt, key: tk.key, n, red: perigo.has(n) || perigo.has(nf), cx: caixa.has(n) || caixa.has(nf), s: tempo.palavra(falada, i, oc), e: tempo.fimPalavra(falada, i, oc) };
      }));
    });
  });

  let html = '', js = '';
  G.forEach((toks, gi) => {
    const gs = gi === 0 ? 0 : r2(Math.max(0, toks[0].s - 0.06));
    const proximo = gi + 1 < G.length ? G[gi + 1][0].s - 0.06 : DUR;
    const ge = gi === G.length - 1 ? DUR : r2(Math.min(proximo, toks[toks.length - 1].e + 0.8, DUR));
    // tokens vermelhos consecutivos dividem uma caixa
    let inner = '', aberta = false;
    toks.forEach((tk, ti) => {
      const red = tk.red, box = !red && tk.cx;
      const cls = ['tk', tk.key || red ? 'serif it' : '', box ? 'bx' : '', red ? 'red' : ''].filter(Boolean).join(' ');
      if (red && !aberta) { inner += `<span class="rbox" id="cg${gi}box"><i class="bxl" id="cg${gi}bl"></i>`; aberta = true; }
      inner += `<span class="${cls}" id="cg${gi}t${ti}" data-t="${tk.s}">${tk.txt}${box ? `<i class="bxl" id="cg${gi}t${ti}b"></i>` : ''}</span>`;
      if (aberta && (ti === toks.length - 1 || !toks[ti + 1].red)) { inner += '</span>'; aberta = false; }
    });
    html += `      <div class="cg clip" id="cg${gi}" data-start="${gs}" data-duration="${r2(ge - gs)}" data-track-index="0">${inner}</div>\n`;
    toks.forEach((tk, ti) => {
      const red = tk.red, box = !red && tk.cx;
      const ts = r2(Math.max(gs, tk.s - 0.03));
      if (box) js += `tl.fromTo('#cg${gi}t${ti}b', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.28, ease: 'expo.out' }, ${r2(ts - 0.02)});\n`;
      if (red && (ti === 0 || !toks[ti - 1].red)) js += `tl.fromTo('#cg${gi}bl', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.3, ease: 'expo.out' }, ${r2(ts - 0.02)});\n`;
      if (tk.s < 0.3) { js += `tl.fromTo('#cg${gi}t${ti}', { scale: 1.12 }, { scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, ${ts});\n`; return; }
      js += (tk.key || red || box)
        ? `tl.fromTo('#cg${gi}t${ti}', { opacity: 0, scale: 0.55, y: 34, rotation: -4 }, { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(1.7)' }, ${ts});\n`
        : `tl.fromTo('#cg${gi}t${ti}', { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.26, ease: 'back.out(2)' }, ${ts});\n`;
    });
  });

  const css = `
.cg{position:absolute;left:0;width:1080px;top:${y}px;height:220px;padding:0 60px;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;align-items:baseline;row-gap:0px}
.tk{position:relative;display:inline-block;margin:0 .14em;font:800 98px/1.12 var(--sans),sans-serif;letter-spacing:-.035em;color:var(--texto);white-space:nowrap;transform-origin:50% 70%;
  text-shadow:0 4px 24px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.9)}
.tk.serif{font-family:var(--serif),serif;font-style:italic;font-weight:700;font-size:112px;letter-spacing:-.01em;color:var(--acento);text-shadow:0 0 30px color-mix(in srgb,var(--acento) 35%,transparent),0 4px 24px rgba(0,0,0,.8)}
.tk.bx{padding:0 .2em;margin:0 .06em}
.tk.red{color:var(--perigo);text-shadow:0 0 30px color-mix(in srgb,var(--perigo) 40%,transparent),0 4px 24px rgba(0,0,0,.8)}
.rbox{position:relative;display:inline-block;padding:0 .12em;margin:0 .1em}
.bxl{position:absolute;left:0;right:0;top:.12em;bottom:.04em;border:3px solid color-mix(in srgb,var(--acento) 90%,transparent);border-radius:18px;background:color-mix(in srgb,var(--acento) 7%,transparent);transform-origin:0 50%;box-shadow:0 0 24px color-mix(in srgb,var(--acento) 25%,transparent)}
.rbox .bxl{border-color:color-mix(in srgb,var(--perigo) 95%,transparent);background:color-mix(in srgb,var(--perigo) 8%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--perigo) 30%,transparent)}`;
  return cena('captions', DUR, [{ css, html, js }]);
}
