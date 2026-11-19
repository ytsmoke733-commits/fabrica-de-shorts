import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTempo, carregarTempo, norm } from '../kit/tempo.mjs';

const LINES = { duration: 4, lines: [{ i: 0, text: 'Não, não é.', start: 0.2, end: 1.9 }, { i: 1, text: 'Segue pra mais.', start: 2.1, end: 3.6 }] };
const WORDS = [{ w: 'Não,', line: 0, s: 0.2, e: 0.5 }, { w: 'não', line: 0, s: 1.0, e: 1.3 }, { w: 'é.', line: 0, s: 1.5, e: 1.8 },
  { w: 'Segue', line: 1, s: 2.1, e: 2.5 }, { w: 'pra', line: 1, s: 2.6, e: 2.8 }, { w: 'mais.', line: 1, s: 2.9, e: 3.5 }];

test('tempo: mesma API do motion (linha, palavra com ocorrência, fim)', () => {
  const t = criarTempo(LINES, WORDS);
  assert.equal(t.duracao, 4); assert.equal(t.nLinhas, 2); assert.equal(t.ultima, 1);
  assert.equal(t.linha(1), 2.1); assert.equal(t.fimLinha(0), 1.9);
  assert.equal(t.palavra('não', 0), 0.2); assert.equal(t.palavra('não', 0, 2), 1.0);
  assert.equal(t.fimPalavra('mais', 1), 3.5);
  assert.equal(t.palavrasDaLinha(1).length, 3);
  assert.throws(() => t.palavra('xyz', 0), /xyz/);
  assert.equal(norm('Coração!'), 'coracao');
});

test('carregarTempo busca data/lines.json e data/words.json', async () => {
  const pedidos = [];
  globalThis.fetch = async (url) => { pedidos.push(url); return { ok: true, json: async () => (url.endsWith('lines.json') ? LINES : WORDS) }; };
  const t = await carregarTempo('data');
  assert.deepEqual(pedidos.sort(), ['data/lines.json', 'data/words.json']);
  assert.equal(t.palavra('segue', 1), 2.1);
});
