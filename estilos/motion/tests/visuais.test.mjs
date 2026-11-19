import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTempo } from '../kit/tempo.mjs';
import * as I from '../kit/icones.mjs';
import { fundo } from '../kit/fundo.mjs';
import { flashForma, tunel, transicoes } from '../kit/fx.mjs';
import { legendas } from '../kit/legendas.mjs';

const LINES = { duration: 5, lines: [{ i: 0, text: 'Seu coração bate cem mil vezes.', start: 0.2, end: 2.8 }, { i: 1, text: 'Segue pra mais.', start: 3.1, end: 4.3 }] };
const WORDS = ['Seu', 'coração', 'bate', 'cem', 'mil', 'vezes.'].map((w, k) => ({ w, line: 0, s: 0.2 + k * 0.4, e: 0.55 + k * 0.4 }))
  .concat(['Segue', 'pra', 'mais.'].map((w, k) => ({ w, line: 1, s: 3.1 + k * 0.4, e: 3.45 + k * 0.4 })));

test('ícones são SVG e usam variáveis do tema', () => {
  for (const s of [I.cursor('c'), I.cadeado(80, 'var(--acento)'), I.olho(true, 'var(--acento)'), I.coracao(80, 'var(--perigo)'), I.check(60, 'var(--acento)'), I.raio(60, 'var(--alerta)')]) assert.match(s, /^<svg[\s\S]*<\/svg>$/);
  for (const s of [I.cadeado(80, 'var(--acento)'), I.olho(true, 'var(--acento)'), I.coracao(80, 'var(--perigo)'), I.check(60, 'var(--acento)'), I.raio(60, 'var(--alerta)')]) assert.match(s, /var\(--(acento|perigo|alerta)\)/);
});

test('dois túneis com cores diferentes ficam em elementos distintos', () => {
  const fx = transicoes(5, [tunel(1, 0.7, 'var(--acento)'), tunel(3, 0.7, 'var(--perigo)')]);
  const divs = fx.html.match(/<div class="tn"[^>]*>/g);
  assert.equal(divs.length, 16);
  assert.ok(divs.slice(0, 8).every((d) => d.includes('var(--acento)') && !d.includes('--perigo')));
  assert.ok(divs.slice(8).every((d) => d.includes('var(--perigo)') && !d.includes('--acento')));
  assert.ok(!/\.tn\{[^}]*var\(--(acento|perigo)\)/.test(fx.css));
});

test('legendas: bloco sem * lança', () => {
  const t = criarTempo(LINES, WORDS);
  assert.throws(() => legendas(t, [{ text: 'Seu coração bate cem mil vezes.', caps: 'Seu *coração | bate | cem *mil | *vezes' }, { text: 'Segue pra mais.' }], {}), /legenda da linha 0: bloco "bate" precisa de exatamente uma palavra com \*/);
});

test('legendas: caps diferente do texto lança', () => {
  const t = criarTempo(LINES, WORDS);
  assert.throws(() => legendas(t, [{ text: 'Seu coração bate cem mil vezes.', caps: '*Seu | *outro | *bate' }, { text: 'Segue pra mais.' }], {}), /legenda da linha 0: caps não batem com o texto falado/);
});

test('legendas: sem caps, 6 palavras geram 2 blocos com um destaque cada', () => {
  const t = criarTempo(LINES, WORDS);
  const cap = legendas(t, [{ text: 'Seu coração bate cem mil vezes.' }, { text: 'Segue pra mais.' }], {});
  const blocos = cap.html.match(/<div class="cg clip"[\s\S]*?<\/div>/g);
  assert.equal(blocos.length, 3);
  for (const b of blocos) assert.equal((b.match(/class="tk serif/g) || []).length, 1);
});

test('legendas: palavra repetida mapeia o 2º bloco para a 2ª ocorrência', () => {
  const L = { duration: 3, lines: [{ i: 0, text: 'Não, não é.', start: 0.2, end: 2 }] };
  const W = [{ w: 'Não,', line: 0, s: 0.2, e: 0.5 }, { w: 'não', line: 0, s: 1.0, e: 1.3 }, { w: 'é.', line: 0, s: 1.5, e: 1.8 }];
  const cap = legendas(criarTempo(L, W), [{ text: 'Não, não é.', caps: '*Não | *não é' }], {});
  const ts = [...cap.html.matchAll(/data-t="([\d.]+)"/g)].map((m) => +m[1]);
  assert.deepEqual(ts, [0.2, 1, 1.5]);
});

test('fundo, transições e legendas viram cenas com id certo', () => {
  const t = criarTempo(LINES, WORDS);
  assert.equal(fundo(5, { cortes: [3.0] }).id, 'bg');
  const fx = transicoes(5, [flashForma(2.9, 'asterisco', 'var(--acento)'), tunel(3.5, 1.5, 'var(--destaque)')]);
  assert.equal(fx.id, 'fx');
  const cap = legendas(t, [{ text: 'Seu coração bate cem mil vezes.', caps: 'Seu *coração | *bate | 100 *mil | *vezes' }, { text: 'Segue pra mais.' }], {});
  assert.equal(cap.id, 'captions');
  assert.ok(cap.html.includes('coração') && cap.html.includes('Segue'));
});

test('legenda sem caps escolhe a palavra mais longa como destaque', () => {
  const t = criarTempo(LINES, WORDS);
  const cap = legendas(t, [{ text: 'Seu coração bate cem mil vezes.' }, { text: 'Segue pra mais.' }], {});
  assert.match(cap.html, /class="[^"]*serif[^"]*"[^>]*>coração/);
});

const wordsDe = (txt, t0) => txt.split(' ').map((w, k) => ({ w, line: 0, s: t0 + k * 0.5, e: t0 + k * 0.5 + 0.3 }));
const tempoDe = (txt) => criarTempo({ duration: 6, lines: [{ i: 0, text: txt, start: 0.2, end: 5 }] }, wordsDe(txt, 1));

test('legendas: algarismo nas caps casa por posição e usa o tempo da palavra falada', () => {
  const cap = legendas(tempoDe('Fica sete anos.'), [{ text: 'Fica sete anos.', caps: '*Fica | *7 anos' }], {});
  const ts = [...cap.html.matchAll(/data-t="([\d.]+)"/g)].map((m) => +m[1]);
  assert.deepEqual(ts, [1, 1.5, 2]);
  assert.ok(cap.html.includes('>7'));
});

test('legendas: algarismo em outra palavra também é aceito', () => {
  assert.doesNotThrow(() => legendas(tempoDe('Umas cem mil vezes.'), [{ text: 'Umas cem mil vezes.', caps: 'Umas 100 *mil | *vezes' }], {}));
});

test('legendas: "36 milhões" nas caps cobre "trinta e seis milhões" falado, entrando inteiro na 1ª palavra falada', () => {
  const cap = legendas(tempoDe('mais de trinta e seis milhões'), [{ text: 'mais de trinta e seis milhões', caps: 'mais de *36 milhões' }], {});
  const ts = [...cap.html.matchAll(/data-t="([\d.]+)"/g)].map((m) => +m[1]);
  assert.deepEqual(ts, [1, 1.5, 2, 2]); // o número inteiro entra junto, na 1ª palavra falada dele
  assert.match(cap.html, />36</);
  assert.match(cap.html, />milhões</);
});

test('legendas: valor das caps diferente do falado lança', () => {
  assert.throws(() => legendas(tempoDe('trinta e seis milhões'), [{ text: 'trinta e seis milhões', caps: '*37 milhões' }], {}), /legenda da linha 0: "37 milhões" não bate com o falado "trinta e seis milhões"/);
});

test('legendas: número por extenso nas caps lança (a tela usa algarismos)', () => {
  assert.throws(() => legendas(tempoDe('Umas cem mil vezes.'), [{ text: 'Umas cem mil vezes.', caps: 'Umas cem *mil | *vezes' }], {}), /legenda da linha 0: "cem" por extenso nas caps — use algarismos/);
});

test('legendas: sem caps, número falado por extenso aparece em algarismos e vira o destaque', () => {
  const cap = legendas(tempoDe('Bate cem mil vezes.'), [{ text: 'Bate cem mil vezes.' }], {});
  assert.ok(!cap.html.includes('cem'));
  assert.match(cap.html, /class="tk serif it"[^>]*>100</);
  const ts = [...cap.html.matchAll(/data-t="([\d.]+)"/g)].map((m) => +m[1]);
  assert.deepEqual(ts, [1, 1.5, 1.5, 2.5]);
  const sete = legendas(tempoDe('Fica sete anos.'), [{ text: 'Fica sete anos.' }], {}).html;
  assert.match(sete, />7</);
});

test('legendas: sem caps, "um" artigo continua palavra', () => {
  const cap = legendas(tempoDe('tirou um dia'), [{ text: 'tirou um dia' }], {});
  assert.match(cap.html, />um</);
});

test('legendas: perigo e caixa aceitam a palavra falada ou a exibida', () => {
  const run = (op) => legendas(tempoDe('Fica sete anos.'), [{ text: 'Fica sete anos.', caps: '*Fica | *7 anos' }], op).html;
  assert.match(run({ perigo: ['sete'] }), /class="tk serif it red"[^>]*>7/);
  assert.match(run({ perigo: ['7'] }), /class="tk serif it red"[^>]*>7/);
  assert.match(run({ caixa: ['7'] }), /class="tk serif it bx"[^>]*>7<i class="bxl"/);
  assert.match(run({ caixa: ['sete'] }), /class="tk serif it bx"[^>]*>7<i class="bxl"/);
});

test('legendas: token só de pontuação ("—") é ignorado, com e sem caps', () => {
  const txt = 'Ele voltou — e lembrou.';
  const L = { duration: 6, lines: [{ i: 0, text: txt, start: 0.2, end: 5 }] };
  const W = ['Ele', 'voltou', 'e', 'lembrou.'].map((w, k) => ({ w, line: 0, s: 1 + k * 0.5, e: 1.3 + k * 0.5 }));
  const t = criarTempo(L, W);
  const sem = legendas(t, [{ text: txt }], {});
  assert.ok(sem.html.includes('voltou') && !sem.html.includes('—'));
  const com = legendas(t, [{ text: txt, caps: 'Ele *voltou | e *lembrou' }], {});
  assert.ok(com.html.includes('lembrou') && !com.html.includes('—'));
});

test('legendas: "milhões" sem número fica palavra, com e sem caps', () => {
  const sem = legendas(tempoDe('Testa milhões de senhas.'), [{ text: 'Testa milhões de senhas.' }], {}).html;
  assert.match(sem, />milhões</);
  assert.ok(!sem.includes('milhão'));
  assert.doesNotThrow(() => legendas(tempoDe('Testa milhões de senhas.'), [{ text: 'Testa milhões de senhas.', caps: 'Testa *milhões | de *senhas' }], {}));
});

test('legendas: "entre dois e três meses" sem caps mostra 2 e 3 separados, com "e" entre eles', () => {
  const html = legendas(tempoDe('entre dois e três meses'), [{ text: 'entre dois e três meses' }], {}).html;
  assert.match(html, />2</);
  assert.match(html, />3</);
  assert.match(html, />e</);
});

test('legendas: "*50%" nas caps cobre "cinquenta por cento"; sem caps vira "50%"', () => {
  const t = 'cinquenta por cento dos casos.';
  const cap = legendas(tempoDe(t), [{ text: t, caps: '*50% | dos *casos' }], {});
  assert.match(cap.html, />50%</);
  assert.throws(() => legendas(tempoDe(t), [{ text: t, caps: '*50 | dos *casos' }], {}), /não bate/);
  assert.match(legendas(tempoDe(t), [{ text: t }], {}).html, />50%</);
});
