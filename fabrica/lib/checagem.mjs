import { LIMITE_S } from './paths.mjs';
import { plataformasDaMarca } from './marca.mjs';
import { lerNumero, ehEscala, FECHA } from './numeros.mjs';
import { ESTILOS } from './estilos.mjs';

const PALAVRAS_POR_S = 2.9; // medido na voz pm_alex x1.0 (105 palavras em ~36 s)
const contar = (t) => String(t).split(/\s+/).filter(Boolean).length;

// Números na tela vão em algarismos ("100 mil", "36 milhões"). "um/uma" fica de fora (artigo);
// escala (mil, milhões...) só vale logo depois de um algarismo; a escala no plural (milhões, bilhões, trilhões)
// SOZINHA, sem número antes, é palavra comum ("milhões de senhas"). N_PLURAL deve ser igual ao PLURAL de estilos/motion/kit/numeros.mjs.
const N_BASE = new Set(('zero dois duas tres quatro cinco seis sete oito nove dez onze doze treze catorze quatorze quinze dezesseis dezessete dezoito dezenove ' +
  'vinte trinta quarenta cinquenta sessenta setenta oitenta noventa cem cento duzentos duzentas trezentos trezentas quatrocentos quatrocentas quinhentos quinhentas ' +
  'seiscentos seiscentas setecentos setecentas oitocentos oitocentas novecentos novecentas').split(' '));
const N_ESCALA = new Set(['mil', 'milhao', 'milhoes', 'bilhao', 'bilhoes', 'trilhao', 'trilhoes']);
const N_PLURAL = new Set(['milhoes', 'bilhoes', 'trilhoes']);
const normN = (w) => String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

const palavras = (s) => String(s).replace(/\|/g, ' ').split(/\s+/).map((w) => w.replace(/^\*/, '')).filter((w) => normN(w));

// Caps x texto falado: mesma sequência de palavras; um algarismo (+ escala) cobre o número falado ali, com o MESMO valor.
// Lê o número falado com a mesma lerNumero do kit (lib/numeros.mjs é cópia fiel), para fábrica e kit decidirem igual.
export function checarCapsTexto(caps, text) {
  const cs = palavras(caps), fs = palavras(text);
  const erro = (por) => [`caps "${caps}" não batem com o texto "${text}" (${por})`];
  let p = 0;
  for (let c = 0; c < cs.length; c++) {
    if (/\d/.test(cs[c])) {
      const tok = cs[c];
      const grupo = [tok];
      if (!FECHA.test(tok) && c + 1 < cs.length && ehEscala(cs[c + 1])) grupo.push(cs[c + 1]);
      const vc = lerNumero(grupo, 0);
      const vf = lerNumero(fs, p, { um: true });
      if (!vf) return erro(`"${grupo.join(' ')}" sem número falado na posição`);
      if (!!vf.pct !== tok.endsWith('%')) return erro(`"${tok}" não bate com o falado "${fs.slice(p, p + vf.n).join(' ')}" (use % só com "por cento")`);
      if (!vc || vf.valor !== vc.valor) return erro(`"${grupo.join(' ')}" não bate com o falado "${fs.slice(p, p + vf.n).join(' ')}"`);
      p += vf.n; c += grupo.length - 1;
      continue;
    }
    if (p >= fs.length) return erro(`"${cs[c]}" a mais`);
    if (normN(cs[c]) !== normN(fs[p])) return erro(`"${cs[c]}" no lugar de "${fs[p]}"`);
    p++;
  }
  if (p < fs.length) return erro(`faltou "${fs.slice(p).join(' ')}"`);
  return [];
}

export function checarCaps(caps) {
  const erros = [];
  for (const bloco of String(caps).split('|').map((b) => b.trim())) {
    const ws = bloco.split(/\s+/).filter(Boolean);
    if (ws.length < 1 || ws.length > 3) erros.push(`bloco "${bloco}" tem ${ws.length} palavras (use 1 a 3)`);
    const destaques = ws.filter((w) => w.startsWith('*')).length;
    if (destaques !== 1) erros.push(`bloco "${bloco}" tem ${destaques} palavras em destaque (use exatamente 1)`);
    ws.forEach((w, k) => {
      const n = normN(w);
      if (N_BASE.has(n) || (N_ESCALA.has(n) && !N_PLURAL.has(n) && !(k > 0 && /\d/.test(ws[k - 1])))) erros.push(`bloco "${bloco}": "${w.replace(/^\*/, '')}" por extenso — use algarismos (ex.: 100 mil, 36 milhões)`);
    });
  }
  return erros;
}

export function estimarSegundos(script, plataforma) {
  const n = script.lines.length;
  const linhas = script.lines.map((l, i) => (i === n - 1 && l.variantes && l.variantes[plataforma] ? l.variantes[plataforma] : l));
  const palavras = linhas.reduce((s, l) => s + contar(l.text), 0);
  return palavras / PALAVRAS_POR_S + (script.lead ?? 0.4) + (script.outro ?? 0.9) + n * (script.gap ?? 0.28);
}

export function checarScript(script, { marca, estilo }) {
  const erros = [];
  // comparação exata caps x fala só para estilos com kit (um estilo sem kit permite caps diferentes da fala)
  const comKit = !!ESTILOS[estilo]?.kit;
  if (script.lang !== 'pt') erros.push('lang deve ser "pt"');
  if (!script.gancho || !String(script.gancho).trim()) erros.push('falta "gancho" (o gancho dos 2 primeiros segundos, em uma frase)');
  if (!Array.isArray(script.sources) || script.sources.length === 0) erros.push('falta "sources" (pelo menos 1 fonte)');
  if (!script.postar || !script.postar.titulo || !script.postar.descricao || !Array.isArray(script.postar.hashtags)) erros.push('falta "postar" com titulo, descricao e hashtags');
  if (!marca.estilos.includes(estilo)) erros.push(`estilo "${estilo}" não é permitido na marca ${marca.id} (permitidos: ${marca.estilos.join(', ')})`);
  if (!Array.isArray(script.lines) || script.lines.length < 3) { erros.push('o roteiro precisa de pelo menos 3 linhas'); return erros; }

  script.lines.forEach((l, i) => { if (l.caps) checarCaps(l.caps).forEach((e) => erros.push(`linha ${i}: ${e}`)); if (l.caps && comKit) checarCapsTexto(l.caps, l.text).forEach((e) => erros.push(`linha ${i}: ${e}`)); });

  const plats = plataformasDaMarca(marca);
  const ultima = script.lines.at(-1);
  if (!ultima.variantes) erros.push(`a última linha precisa de "variantes" com a chamada final de: ${plats.join(', ')}`);
  else for (const p of plats) {
    const v = ultima.variantes[p];
    if (!v || !v.text) { erros.push(`falta a variante "${p}" na última linha`); continue; }
    if (v.caps) checarCaps(v.caps).forEach((e) => erros.push(`variante ${p}: ${e}`));
    if (v.caps && comKit) checarCapsTexto(v.caps, v.text).forEach((e) => erros.push(`variante ${p}: ${e}`));
    const pedeInscricao = /inscrev/i.test(v.text);
    if (p === 'shorts' ? !pedeInscricao : (pedeInscricao || !/\b(segue|siga|seguir|sigam)\b/i.test(v.text))) {
      erros.push(`variante ${p}: a chamada final precisa pedir para ${p === 'shorts' ? 'se inscrever' : 'seguir'}`);
    }
    const s = estimarSegundos(script, p);
    if (s > LIMITE_S[p]) erros.push(`${p}: duração estimada ${s.toFixed(1)} s passa do limite de ${LIMITE_S[p]} s`);
  }

  const hashtags = Array.isArray(script.postar?.hashtags) ? script.postar.hashtags.join(' ') : '';
  const textoRoteiro = script.lines.map((l) => [l.text, ...Object.values(l.variantes || {}).map((v) => v.text)].join(' ')).join(' ');
  const texto = [script.gancho || '', script.postar?.titulo || '', script.postar?.descricao || '', hashtags, textoRoteiro].join(' ');
  for (const re of marca.proibido || []) {
    let proibido;
    try { proibido = new RegExp(re, 'i'); } catch { erros.push(`regex inválida em proibido da marca ${marca.id}: ${re}`); continue; }
    if (proibido.test(texto)) erros.push(`conteúdo proibido na marca ${marca.id}: /${re}/`);
  }
  return erros;
}
