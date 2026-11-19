import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTempo } from '../kit/tempo.mjs';

const LINES = { duration: 6.5, lines: [{ i: 0, text: 'Quantas vezes seu coração bate?', start: 0.3, end: 2.4 }, { i: 1, text: 'Cem mil.', start: 2.7, end: 3.6 }, { i: 2, text: 'Segue pra mais.', start: 4.0, end: 5.2 }] };
const WORDS = [
  { w: 'Quantas', line: 0, s: 0.3, e: 0.7 }, { w: 'vezes', line: 0, s: 0.72, e: 1.0 }, { w: 'seu', line: 0, s: 1.02, e: 1.2 }, { w: 'coração', line: 0, s: 1.22, e: 1.8 }, { w: 'bate?', line: 0, s: 1.82, e: 2.4 },
  { w: 'Cem', line: 1, s: 2.7, e: 3.0 }, { w: 'mil.', line: 1, s: 3.05, e: 3.6 },
  { w: 'Segue', line: 2, s: 4.0, e: 4.4 }, { w: 'pra', line: 2, s: 4.42, e: 4.6 }, { w: 'mais.', line: 2, s: 4.62, e: 5.2 },
];

test('linhas e duração', () => {
  const t = criarTempo(LINES, WORDS);
  assert.equal(t.duracao, 6.5);
  assert.equal(t.nLinhas, 3);
  assert.equal(t.ultima, 2);
  assert.equal(t.linha(1), 2.7);
  assert.equal(t.fimLinha(1), 3.6);
});

test('palavra sem acento, sem pontuação e por prefixo, só na linha pedida', () => {
  const t = criarTempo(LINES, WORDS);
  assert.equal(t.palavra('coracao', 0), 1.22);
  assert.equal(t.palavra('bate', 0), 1.82);
  assert.equal(t.fimPalavra('mil', 1), 3.6);
  assert.throws(() => t.palavra('mil', 0), /palavra "mil" não encontrada na linha 0/);
});

test('linha inexistente e palavras da linha', () => {
  const t = criarTempo(LINES, WORDS);
  assert.throws(() => t.linha(5), /linha 5 não existe \(roteiro tem 3\)/);
  assert.deepEqual(t.palavrasDaLinha(2).map((w) => w.w), ['Segue', 'pra', 'mais.']);
});

test('consulta que normaliza para vazio lança', () => {
  const t = criarTempo(LINES, WORDS);
  for (const txt of ['', '—', '%']) {
    assert.throws(() => t.palavra(txt, 0), /palavra ".*" inválida \(vazia depois de normalizar\)/);
  }
});

test('casamento exato tem prioridade sobre prefixo', () => {
  const lines = { duration: 2, lines: [{ i: 0, text: 'milhões mil', start: 0, end: 2 }] };
  const words = [{ w: 'milhões', line: 0, s: 1, e: 1.5 }, { w: 'mil', line: 0, s: 1.6, e: 2 }];
  const t = criarTempo(lines, words);
  assert.equal(t.palavra('mil', 0), 1.6);
  assert.equal(t.fimPalavra('mil', 0), 2);
  assert.equal(t.palavra('milh', 0), 1);
});

test('ocorrência escolhe a n-ésima palavra que casa', () => {
  const lines = { duration: 2, lines: [{ i: 0, text: 'não, não', start: 0.5, end: 1.2 }] };
  const words = [{ w: 'não,', line: 0, s: 0.5, e: 0.8 }, { w: 'não', line: 0, s: 0.9, e: 1.2 }];
  const t = criarTempo(lines, words);
  assert.equal(t.palavra('não', 0, 2), 0.9);
  assert.equal(t.fimPalavra('não', 0, 2), 1.2);
  assert.equal(t.palavra('nao', 0), 0.5);
  assert.throws(() => t.palavra('não', 0, 3), /palavra "não" \(ocorrência 3\) não encontrada na linha 0/);
});

test('i precisa ser inteiro', () => {
  const t = criarTempo(LINES, WORDS);
  assert.throws(() => t.linha('1'), /linha 1 não existe \(roteiro tem 3\)/);
});
