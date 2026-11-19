// Vídeo-modelo do motion-b (Marca B, tema B): "A senha mais usada do mundo".
// Gera video/index.html, video/compositions/*.html e voz/data/cues.json a partir de voz/data (lines.json, words.json).
// Rode de novo depois de mudar a narração:  node gen.mjs
// Só importa de ./kit/ (cópia do kit feita pela fábrica) e lê o tema de ./tema.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregarTempo } from './kit/tempo.mjs';
import { carregarTema } from './kit/tema.mjs';
import { cena, escalar, escreverComposicao, escreverIndex, escreverCues } from './kit/base.mjs';
import { fundo } from './kit/fundo.mjs';
import { flashForma, tunel, transicoes } from './kit/fx.mjs';
import { legendas } from './kit/legendas.mjs';
import { login, terminal, ranking, medidor, seguir } from './kit/cartoes.mjs';
import { pilula, manchete, etiqueta } from './kit/camadas.mjs';

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

// ---------- cortes: um por linha ----------
const corte = (i) => r2(tempo.linha(i) - 0.1);
const CORTES = [0, 1, 2, 3, 4].map((i) => (i === 0 ? 0 : corte(i)));
const slots = CORTES.map((a, i) => ({ a, b: i + 1 < CORTES.length ? CORTES[i + 1] : DUR }));
const loc = (i, t) => r2(t - slots[i].a);
const cues = [];
const cue = (t, type, extra = {}) => cues.push({ t: r2(Math.max(0, t)), type, ...extra });
const cenas = [];
const conteudo = (i, id, partes) => cenas.push({ ...cena(id, r2(slots[i].b - slots[i].a), partes), a: slots[i].a, faixa: 1, z: 2 });

// ---------- 0: gancho — pílula de dado + manchete + login digitando 123456 ----------
{
  const tM = tempo.palavra('mais', 0), tU = tempo.palavra('usada', 0), tMu = tempo.palavra('mundo', 0), tC = tempo.palavra('cai', 0), tS = tempo.palavra('segundo', 0);
  const passo = (tMu - tM) / 5;
  const tDig = [0, 1, 2, 3, 4, 5].map((k) => loc(0, tM + k * passo));
  conteudo(0, 'gancho', [
    pilula({ id: 'p0', texto: 'Dado · NordPass 2024', tEntrada: 0.05, tSaida: loc(0, slots[0].b - 0.35) }),
    manchete({ id: 'm0', texto: 'A *senha mais usada do mundo', tEntrada: 0.08, y: 300 }),
    escalar(login({ id: 'l0', titulo: 'Entrar', campo: 'senha', valor: '123456', tEntrada: Math.max(0.1, loc(0, tU - 0.5)), tDigitos: tDig, tMostrar: loc(0, tC) }), { escala: 0.78, de: [540, 560], para: [540, 990] }),
  ]);
  cue(tC, 'pop', { gain: 0.8 });
  cue(tS, 'thud', { gain: 0.7 });
}

// ---------- 1: terminal de demonstração contando tentativas; "achou" com CÂMERA LENTA ----------
{
  const tI = Math.max(tempo.linha(1) - 0.05, slots[1].a + 0.05);
  const tF = Math.max(tempo.palavra('segundo', 1) - 0.2, tI + 0.5);
  const tA = r2(tF + 0.05);
  conteudo(1, 'terminal', [
    escalar(terminal({ id: 't1', comando: '$ teste_de_forca --demo', de: 0, ate: 123456, rotulo: 'tentativas', tInicio: loc(1, tI), tFim: loc(1, tF), tAchou: loc(1, tA), textoAchou: 'senha: 123456', y: 300 }), { escala: 1.06, de: [540, 300], para: [540, 380] }),
    etiqueta({ id: 'cl1', tEntrada: loc(1, tA), tSaida: r2(slots[1].b - slots[1].a - 0.15) }),
    { js: `tl.to('#t1', { scale: 1.01, duration: ${r2(Math.max(0.2, slots[1].b - tA))}, ease: 'none' }, ${loc(1, tA)});` },
  ]);
  cue(tA, 'lento', { gain: 0.9 });
}

// ---------- 2: ranking das senhas mais usadas (barras só mostram a ordem) ----------
{
  const tE = Math.max(tempo.linha(2) - 0.05, slots[2].a + 0.05);
  const tD = tempo.palavra('comum', 2);
  conteudo(2, 'ranking', [ranking({ id: 'r2', titulo: 'Senhas mais usadas', itens: [
    { rotulo: '123456', valor: 100 }, { rotulo: '123456789', valor: 62 }, { rotulo: '12345678', valor: 48 }, { rotulo: 'password', valor: 40 }, { rotulo: 'qwerty123', valor: 33 },
  ], destaque: 0, tEntrada: loc(2, tE), tDestaque: loc(2, tD), y: 330 })]);
  cue(tD, 'pop', { gain: 0.8 });
}

// ---------- 3: medidor ficando FORTE com uma frase longa + pílula da verificação em 2 etapas ----------
{
  const tP = ['frase', 'longa', 'ative', 'verificação'].map((w) => loc(3, tempo.palavra(w, 3)));
  const tE = tempo.palavra('etapas', 3);
  conteudo(3, 'forte', [
    medidor({ id: 'md3', titulo: 'Criar senha', palavras: ['cavalo', 'azul', 'pula', 'muro'], tPalavras: tP, y: 230 }),
    pilula({ id: 'p3', texto: 'Verificação em 2 etapas ✓', tEntrada: loc(3, tE - 0.1), y: 1060 }),
  ]);
  cue(tE, 'pop', { gain: 0.8 });
}

// ---------- 4: chamada final (a fala muda pela variante; o botão acompanha) ----------
{
  const tCl = Math.max(tempo.palavra('pra', ULT), slots[4].a + 0.8);
  conteudo(4, 'seguir', [escalar(seguir({ id: 's1', marca: script.marca_nome || 'Hacker e tecnologia', chamada: /inscrev/i.test(script.lines[script.lines.length - 1].text) ? 'Inscrever-se' : 'Seguir', tEntrada: 0.15, tClique: loc(4, tCl) }), { escala: 1.25, de: [540, 650], para: [540, 810] })]);
  cue(tCl, 'pop', { gain: 0.8 });
}

// ---------- fundo, transições ----------
const bg = { ...fundo(DUR, { cortes: CORTES.slice(1) }), a: 0, faixa: 0, z: 1 };
const fx = { ...transicoes(DUR, [flashForma(CORTES[2], 'cadeado', 'var(--acento)'), tunel(CORTES[4], 0.67, 'var(--acento)')]), a: 0, faixa: 2, z: 3 };
cue(CORTES[2] - 0.02, 'thud', { gain: 0.9 });
cue(CORTES[4] - 0.5, 'riser', { dur: 0.5, gain: 0.6 });
for (const c of CORTES.slice(1)) cue(c - 0.14, 'whoosh', { gain: 0.8 });

// ---------- apoio do terço inferior: fita de dados (y 1450-1600) que acende a cada palavra ----------
const fita = (() => {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // cada bloco ocupa 8 caracteres de 44px mono (0,6em) + letter-spacing .12em, mais o espaço entre blocos
  const PASSO = 9 * 44 * (0.6 + 0.12), LARG = 8 * 44 * (0.72), VEL = 2600 / DUR;
  const ultimo = {};
  const visiveis = (t) => Array.from({ length: 36 }, (_, j) => j).filter((j) => { const c = j * PASSO + LARG / 2 - VEL * t; return c > 160 && c < 920; });
  const blocos = Array.from({ length: 36 }, () => Array.from({ length: 8 }, () => (rnd() < 0.5 ? '0' : '1')).join(''));
  const palavras = Array.from({ length: tempo.nLinhas }, (_, i) => tempo.palavrasDaLinha(i)).flat();
  const css = `
#fita{position:absolute;left:0;top:1460px;width:1080px;height:130px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
#fita-row{position:absolute;left:0;top:34px;white-space:nowrap;font:600 44px/1 var(--mono),monospace;letter-spacing:.12em;color:var(--fraco)}
#fita-row b{font-weight:600}`;
  const html = `
    <div id="fita" data-layout-ignore><div id="fita-row">${blocos.map((b, k) => `<b id="fb${k}">${b}</b>`).join(' ')}</div></div>`;
  // o GSAP não interpola var(...): lê as cores do tema uma vez, em tempo de execução
  const js = `
const AC = getComputedStyle($('fita')).getPropertyValue('--acento').trim(), FR = getComputedStyle($('fita')).getPropertyValue('--fraco').trim();
gsap.set('#fita', { opacity: 0 });
tl.to('#fita', { opacity: 1, duration: 0.4 }, 0.1);
tl.fromTo('#fita-row', { x: 0 }, { x: -2600, duration: ${DUR}, ease: 'none' }, 0);
${palavras.map((w, k) => `tl.fromTo('#fb${(() => { const v = visiveis(w.s); const livres = v.filter((j) => !(j in ultimo) || w.s - ultimo[j] > 0.6); const j = (livres.length ? livres : v)[(k * 2) % (livres.length || v.length)]; ultimo[j] = w.s; return j; })()}', { color: AC }, { color: FR, duration: 0.5, ease: 'power2.out', immediateRender: false }, ${r2(w.s)});`).join('\n')}`;
  return { ...cena('fita', DUR, [{ css, html, js }]), a: 0, faixa: 4, z: 5 };
})();

const caps = { ...legendas(tempo, script.lines), a: 0, faixa: 3, z: 4, tipo: 'captions' };

const todas = [bg, ...cenas, fx, fita, caps];
for (const c of todas) escreverComposicao(VID, c, tema);
escreverIndex(VID, { titulo: script.title, duracao: DUR, cenas: todas.map(({ id, a, d, faixa, z, tipo }) => ({ id, a, d, faixa, z, tipo })), tema });
escreverCues(VOZ, DUR, cues);

console.log('cenas:', todas.map((c) => `${c.id} ${c.a}+${c.d}`).join(' | '));
console.log('cues:', cues.length, '· duração', DUR);
