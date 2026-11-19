// Números nas legendas: a voz fala por extenso ("trinta e seis milhões"), a tela mostra algarismos ("36 milhões").
import { norm } from './tempo.mjs';

const BAS = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
  quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600,
  setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900,
};
const ESC = { mil: 1e3, milhao: 1e6, milhoes: 1e6, bilhao: 1e9, bilhoes: 1e9, trilhao: 1e12, trilhoes: 1e12 };
export const FECHA = /[,.;:!?]$/; // pontuação no fim da palavra encerra o número ("Três, dois, um")

export const ehNumeroPorExtenso = (w) => norm(w) in BAS || norm(w) in ESC;
export const ehEscala = (w) => norm(w) in ESC;
// escala no plural SOZINHA é palavra ("milhões de senhas"). Deve ficar igual ao PLURAL de fabrica/lib/numeros.mjs e ao N_PLURAL de fabrica/lib/checagem.mjs.
const PLURAL = new Set(['milhoes', 'bilhoes', 'trilhoes']);
export const ehEscalaPlural = (w) => PLURAL.has(norm(w));

// "e" só junta a parte seguinte quando ela é de ordem menor: vinte e TRÊS, cento e DOIS, mil e QUINHENTOS; "dois e três" são dois números.
const juntaE = (ult, ultV, nv) => (ult === 'esc' ? true : ultV >= 100 ? nv < 100 : ultV >= 20 ? nv >= 1 && nv < 10 : false);
// Lê o número que começa em palavras[k]. Devolve { valor, n } (n = palavras consumidas) ou null.
// "um/uma" sozinho é artigo ("um dia") e só vira número com { um: true } ou seguido de escala ("um milhão").
export function lerNumero(palavras, k, { um = false } = {}) {
  if (k >= palavras.length) return null;
  const p0 = palavras[k];
  if (/\d/.test(p0)) {
    let v = Number(p0.replace(/[^\d.,]/g, '').replace(/[.,]$/, '').replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(v)) return null;
    let n = 1;
    if (!FECHA.test(p0) && k + 1 < palavras.length && ehEscala(palavras[k + 1])) { v *= ESC[norm(palavras[k + 1])]; n = 2; }
    return { valor: Math.round(v), n };
  }
  let total = 0, atual = 0, ult = null, ultV = 0, i = k, n = 0;
  while (i < palavras.length) {
    const w = norm(palavras[i]);
    if (w in BAS && (ult === null || ult === 'e' || ult === 'esc')) { atual += BAS[w]; ult = 'bas'; ultV = BAS[w]; }
    else if (w in ESC && (ult === 'bas' || (ult === null && !PLURAL.has(w)))) { total += (atual || 1) * ESC[w]; atual = 0; ult = 'esc'; }
    else if (w === 'e' && (ult === 'bas' || ult === 'esc') && !FECHA.test(palavras[i]) && i + 1 < palavras.length && norm(palavras[i + 1]) in BAS && juntaE(ult, ultV, BAS[norm(palavras[i + 1])])) { ult = 'e'; i++; continue; }
    else break;
    i++; n = i - k;
    if (FECHA.test(palavras[i - 1])) break;
  }
  if (!n) return null;
  let pct = false;
  if (!FECHA.test(palavras[k + n - 1]) && k + n + 1 < palavras.length && norm(palavras[k + n]) === 'por' && norm(palavras[k + n + 1]) === 'cento') { pct = true; n += 2; }
  if (n === 1 && !um && (norm(p0) === 'um' || norm(p0) === 'uma')) return null;
  return pct ? { valor: total + atual, n, pct } : { valor: total + atual, n };
}

const pontos = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Valor -> tokens da legenda: 7 | 2024 | 12.345 | 100 mil | 36 milhões | 36,5 milhões | 1 milhão.
// Até 9999 sem ponto (anos ficam "2024").
export function formatarNumeroLegenda(v, pct = false) {
  const t = formatarNumeroLegendaBase(v);
  if (pct) t[t.length - 1] += '%';
  return t;
}
function formatarNumeroLegendaBase(v) {
  for (const [s, sg, pl] of [[1e12, 'trilhão', 'trilhões'], [1e9, 'bilhão', 'bilhões'], [1e6, 'milhão', 'milhões']]) {
    if (v < s) continue;
    const q = v / s;
    if (Number.isInteger(Math.round(q * 1e6) / 1e5)) {
      const [int, dec] = String(Math.round(q * 10) / 10).split('.');
      return [pontos(int) + (dec ? ',' + dec : ''), q < 2 ? sg : pl];
    }
  }
  if (v >= 10000 && v % 1000 === 0) return [pontos(v / 1000), 'mil'];
  if (v >= 10000) return [pontos(v)];
  return [String(v)];
}
