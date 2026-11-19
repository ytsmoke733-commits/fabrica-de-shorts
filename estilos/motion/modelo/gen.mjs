// Vídeo-modelo do kit motion: "Quantas vezes seu coração bate num dia?"
// Gera video/index.html, video/compositions/*.html e voz/data/cues.json a partir de voz/data (lines.json, words.json).
// Rode de novo depois de mudar a narração:  node gen.mjs
// Só importa de ./kit/ (cópia do kit feita pela fábrica) e lê o tema de ./tema.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregarTempo } from './kit/tempo.mjs';
import { carregarTema } from './kit/tema.mjs';
import { cena, escalar, escreverComposicao, escreverIndex, escreverCues } from './kit/base.mjs';
import { coracao } from './kit/icones.mjs';
import { fundo } from './kit/fundo.mjs';
import { flashForma, tunel, transicoes } from './kit/fx.mjs';
import { legendas } from './kit/legendas.mjs';
import { painel, regua, seguir } from './kit/cartoes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VID = path.join(HERE, 'video');
const VOZ = path.join(HERE, 'voz');
const r2 = (x) => Math.round(x * 1000) / 1000;

const tema = carregarTema(path.join(HERE, 'tema.json'));
const tempo = carregarTempo(VOZ);
const script = JSON.parse(fs.readFileSync(path.join(VOZ, 'script.json'), 'utf8'));
const DUR = r2(tempo.duracao);
const ULT = tempo.ultima;
if (tempo.nLinhas !== 5) throw new Error(`o modelo espera 5 linhas, voz/data tem ${tempo.nLinhas}`);

// ---------- cortes: um por linha (a linha 0 começa no zero) ----------
const corte = (i) => r2(tempo.linha(i) - 0.1);
const CORTES = [0, 1, 2, 3, 4].map((i) => (i === 0 ? 0 : corte(i)));
const slots = CORTES.map((a, i) => ({ a, b: i + 1 < CORTES.length ? CORTES[i + 1] : DUR }));
const loc = (i, t) => r2(t - slots[i].a); // tempo absoluto -> tempo local da cena i

const cues = [];
const cue = (t, type, extra = {}) => cues.push({ t: r2(Math.max(0, t)), type, ...extra });

const cenas = [];
const conteudo = (i, id, partes) => {
  const c = cena(id, r2(slots[i].b - slots[i].a), partes);
  cenas.push({ ...c, a: slots[i].a, faixa: 1, z: 2 });
};

// ---------- 0: gancho com tipografia mista e coração pulsando ----------
{
  const tQ = tempo.palavra('quantas', 0), tS = tempo.palavra('seu', 0), tC = tempo.palavra('coração', 0), tB = tempo.palavra('bate', 0);
  const css = `
#g-heart{position:absolute;left:0;top:420px;width:1080px;display:flex;justify-content:center;filter:drop-shadow(0 0 70px color-mix(in srgb,var(--perigo) 55%,transparent))}
#g-heartp{display:block;transform-origin:50% 55%}
.g-l{position:absolute;left:0;width:1080px;text-align:center;letter-spacing:-.03em;white-space:nowrap}
#g-a{top:790px;font:800 128px/1 var(--sans),sans-serif;color:var(--texto)}
#g-b{top:930px;font:italic 700 158px/1 var(--serif),serif;color:var(--acento);letter-spacing:-.01em;text-shadow:0 0 40px color-mix(in srgb,var(--acento) 35%,transparent)}
#g-c{top:1100px;font:800 112px/1 var(--sans),sans-serif;color:var(--texto)}`;
  const html = `
    <div id="g">
      <div id="g-heart" data-layout-ignore><span id="g-heartp">${coracao(360, 'var(--perigo)')}</span></div>
      <div class="g-l" id="g-a">Quantas vezes</div>
      <div class="g-l" id="g-b">seu coração</div>
      <div class="g-l" id="g-c">bate num dia?</div>
    </div>`;
  const batidas = [];
  for (let t = 0.2; t < slots[0].b - 0.3; t += 0.72) batidas.push(r2(t));
  const js = `
spring($('g-heart'), 0.02, { y: 90, scale: 0.4 }, 0.7);
spring($('g-a'), ${Math.max(0.02, loc(0, tQ - 0.05))}, { y: 60, scale: 0.8 }, 0.5);
spring($('g-b'), ${Math.max(0.02, loc(0, tS - 0.05))}, { y: 60, scale: 0.7 }, 0.55);
spring($('g-c'), ${Math.max(0.02, loc(0, tB - 0.05))}, { y: 60, scale: 0.8 }, 0.5);
pop($('g-b'), ${loc(0, tC)}, 1.12);
${batidas.map((t) => `tl.fromTo($('g-heartp'), { scale: 1 }, { scale: 1.16, duration: 0.11, ease: 'power2.out' }, ${t});
tl.to($('g-heartp'), { scale: 1, duration: 0.3, ease: 'power2.in' }, ${r2(t + 0.11)});`).join('\n')}`;
  conteudo(0, 'gancho', [{ css, html, js }]);
  batidas.forEach((t) => cue(t, 'thud', { gain: 0.4 }));
  cue(tC, 'pop', { gain: 0.8 });
}

// coração pequeno que bate acima de um número (ocupa a faixa y 420-700 dos painéis)
const coracaoApoio = (id, topo, tam, tInicio) => ({
  css: `#${id}{position:absolute;left:0;top:${topo}px;width:1080px;display:flex;justify-content:center;filter:drop-shadow(0 0 50px color-mix(in srgb,var(--perigo) 50%,transparent))}#${id}p{display:block;transform-origin:50% 55%}`,
  html: `<div id="${id}" data-layout-ignore><span id="${id}p">${coracao(tam, 'var(--perigo)')}</span></div>`,
  js: `spring($('${id}'), ${r2(Math.max(0.02, tInicio - 0.2))}, { y: 60, scale: 0.5 }, 0.55);
for (let k = 0; k < 12; k++) { const t = ${r2(Math.max(0.02, tInicio))} + k * 0.72;
  tl.fromTo($('${id}p'), { scale: 1 }, { scale: 1.16, duration: 0.11, ease: 'power2.out' }, t);
  tl.to($('${id}p'), { scale: 1, duration: 0.3, ease: 'power2.in' }, t + 0.11); }`,
});

// ---------- 1: painel de 0 a 100.000 terminando em "mil" ----------
{
  const tI = Math.max(tempo.linha(1) - 0.05, slots[1].a + 0.05);
  const tF = Math.max(tempo.palavra('mil', 1), tI + 0.35);
  conteudo(1, 'cem-mil', [coracaoApoio('h1', 440, 300, 0.05), painel({ id: 'p1', rotulo: 'batidas por dia', de: 0, ate: 100000, tInicio: loc(1, tI), tFim: loc(1, tF), y: 800 })]);
  cue(tF, 'pop', { gain: 0.9 });
}

// ---------- 2: painel de 0 a 36.500.000 terminando em "ano" ----------
{
  const tI = Math.max(tempo.linha(2) - 0.05, slots[2].a + 0.05);
  const tF = Math.max(tempo.palavra('ano', 2), tI + 0.5);
  conteudo(2, 'por-ano', [coracaoApoio('h2', 440, 300, 0.05), painel({ id: 'p2', rotulo: 'por ano', de: 0, ate: 36500000, tInicio: loc(2, tI), tFim: loc(2, tF), y: 800 })]);
  cue(tF, 'pop', { gain: 0.9 });
}

// ---------- 3: régua de dias de folga, valor 0 e selo "0" em "folga" ----------
{
  const tI = Math.max(tempo.linha(3), slots[3].a + 0.1);
  const tF = Math.max(tempo.palavra('folga', 3), tI + 0.4);
  conteudo(3, 'folga', [regua({ id: 'r1', rotulo: 'dias de folga', max: 365, valor: 0, tInicio: loc(3, tI), tFim: loc(3, tF), selo: '0' })]);
  cue(tF, 'pop', { gain: 0.9 });
}

// ---------- 4: chamada final (o texto do botão não muda por plataforma; a fala muda pela variante) ----------
{
  const tCl = Math.max(tempo.palavra('pra', ULT), slots[4].a + 0.8);
  conteudo(4, 'seguir', [escalar(seguir({ id: 's1', marca: script.marca_nome || 'Conhecimento', chamada: /inscrev/i.test(script.lines[script.lines.length - 1].text) ? 'Inscrever-se' : 'Seguir', tEntrada: 0.15, tClique: loc(4, tCl) }), { escala: 1.25, de: [540, 650], para: [540, 810] })]);
  cue(tCl, 'pop', { gain: 0.8 });
}

// ---------- fundo, transições e legendas ----------
const bg = { ...fundo(DUR, { cortes: CORTES.slice(1) }), a: 0, faixa: 0, z: 1 };
const t2 = CORTES[2], t4 = CORTES[4];
const fx = {
  ...transicoes(DUR, [flashForma(t2, 'coracao', 'var(--acento)'), tunel(t4, 0.67, 'var(--acento)')]),
  a: 0, faixa: 2, z: 3,
};
cue(t2 - 0.02, 'thud', { gain: 0.9 });
cue(t4 - 0.5, 'riser', { dur: 0.5, gain: 0.6 });
for (const c of CORTES.slice(1)) cue(c - 0.14, 'whoosh', { gain: 0.8 });

// ---------- apoio do terço inferior: linha de batimento (ECG), y 1450-1600, 120 px livres à direita ----------
const ecg = (() => {
  const W = 900, H = 150, y0 = 75, B = 225;
  const pts = [];
  for (let b = 0; b < 4; b++) {
    const x = b * B;
    pts.push([x, y0], [x + 40, y0], [x + 50, y0 - 12], [x + 60, y0], [x + 90, y0], [x + 98, y0 + 13], [x + 110, y0 - 63], [x + 122, y0 + 53], [x + 132, y0], [x + 150, y0], [x + 165, y0 - 15], [x + 180, y0], [x + B, y0]);
  }
  const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const palavras = Array.from({ length: tempo.nLinhas }, (_, i) => tempo.palavrasDaLinha(i)).flat();
  const css = `
#ecg{position:absolute;left:60px;top:1450px;width:${W}px;height:${H}px}
#ecg svg{position:absolute;left:0;top:0;overflow:visible}
#ecg-box{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 50%}`;
  const html = `
    <div id="ecg" data-layout-ignore><div id="ecg-box"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <path id="ecg-base" d="${d}" pathLength="1000" fill="none" style="stroke:var(--perigo)" stroke-opacity=".3" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
      <path id="ecg-head" d="${d}" pathLength="1000" fill="none" style="stroke:var(--acento)" stroke-width="8" stroke-linejoin="round" stroke-linecap="butt" stroke-dasharray="150 1000" stroke-dashoffset="150"/>
    </svg></div></div>`;
  const js = `
gsap.set('#ecg-box', { opacity: 0 });
tl.to('#ecg-box', { opacity: 1, duration: 0.4 }, 0.1);
for (let t = 0.1; t < ${DUR}; t += 1.5) tl.fromTo('#ecg-head', { strokeDashoffset: 150 }, { strokeDashoffset: -1000, duration: 1.4, ease: 'none' }, t);
${palavras.map((w, k) => { const tot = Math.min(0.3, (palavras[k + 1] ? palavras[k + 1].s : w.s + 0.3) - w.s - 0.01); if (tot < 0.06) return ''; const up = r2(tot * 0.3);
  return `tl.fromTo('#ecg-box', { scaleY: 1 }, { scaleY: 1.3, duration: ${up}, ease: 'power2.out', immediateRender: false }, ${r2(w.s)});
tl.to('#ecg-box', { scaleY: 1, duration: ${r2(tot - up)}, ease: 'power2.in' }, ${r2(w.s + up)});`; }).filter(Boolean).join('\n')}`;
  return { ...cena('ecg', DUR, [{ css, html, js }]), a: 0, faixa: 4, z: 5 };
})();

const caps = { ...legendas(tempo, script.lines), a: 0, faixa: 3, z: 4, tipo: 'captions' };

const todas = [bg, ...cenas, fx, ecg, caps];
for (const c of todas) escreverComposicao(VID, c, tema);
escreverIndex(VID, { titulo: script.title, duracao: DUR, cenas: todas.map(({ id, a, d, faixa, z, tipo }) => ({ id, a, d, faixa, z, tipo })), tema });
escreverCues(VOZ, DUR, cues);

console.log('cenas:', todas.map((c) => `${c.id} ${c.a}+${c.d}`).join(' | '));
console.log('cues:', cues.length, '· duração', DUR);
