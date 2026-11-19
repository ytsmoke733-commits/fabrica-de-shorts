import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setCtx } from '../kit/motor/lib.js';
import { usarTemaEvidencias, medidasDoCarimbo, bordaRasgada, filme, recorteDeJornal, dataDatilografada, ficha } from '../kit/evidencias.mjs';
import { ctxFalso } from './ctx-falso.mjs';

const tema = JSON.parse(readFileSync(new URL('../temas/tema.json', import.meta.url), 'utf8'));
usarTemaEvidencias(tema);
const medir = (s, px) => s.length * 0.6 * px;

test('nada de Math.random nas evidências, painéis e tela (tudo de semente fixa ou de t)', () => {
  for (const arq of ['evidencias.mjs', 'paineis.mjs', 'tela.mjs']) {
    const src = readFileSync(new URL(`../kit/${arq}`, import.meta.url), 'utf8');
    assert.ok(!/Math\.random/.test(src), `${arq} usa Math.random`);
  }
});

test('carimbo curto fica em 64 px na moldura de 340; longo encolhe para caber na moldura', () => {
  const curto = medidasDoCarimbo('PRESO', medir);
  assert.equal(curto.px, 64); assert.equal(curto.largura, 340);
  for (const txt of ['NÃO RESOLVIDO', 'CONDENADO', 'ARQUIVADO', 'CASO ENCERRADO EM 2019']) {
    const m = medidasDoCarimbo(txt, medir);
    assert.ok(m.px <= 64 && m.px > 20, `${txt}: ${m.px}`);
    assert.ok(m.largura <= 460, `${txt}: moldura ${m.largura}`);
    assert.ok(medir(txt, m.px) <= m.largura - 40, `${txt}: texto ${medir(txt, m.px)} não cabe em ${m.largura}`);
  }
});

test('borda rasgada: determinística por semente, perto do retângulo, sementes diferentes dão bordas diferentes', () => {
  const a = bordaRasgada(600, 400, 3), b = bordaRasgada(600, 400, 3), c = bordaRasgada(600, 400, 4);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.ok(a.length > 40);
  for (const [x, y] of a) assert.ok(Math.abs(x) <= 300 + 12 && Math.abs(y) <= 200 + 12, `${x},${y}`);
});

test('filme: grão é função de t, preso a 24 quadros por segundo', () => {
  const quadro = (t) => { const g = ctxFalso(); setCtx(g); filme(t); return JSON.stringify(g.chamadas); };
  assert.equal(quadro(1.0), quadro(1.0));
  assert.equal(quadro(1.0), quadro(1.01));      // mesmo quadro de 24 fps
  assert.notEqual(quadro(1.0), quadro(1.05));   // quadro seguinte
});

test('recorte de jornal: k = 0 não desenha; k = 1 traz jornal, manchete e data', () => {
  let g = ctxFalso(); setCtx(g);
  recorteDeJornal(540, 900, 1, 0.05, { titulo: 'HOSPITAIS CANCELAM CONSULTAS', jornal: 'NOTÍCIAS', data: '13 MAI 2017' }, 0);
  assert.equal(g.chamadas.length, 0);
  g = ctxFalso(); setCtx(g);
  recorteDeJornal(540, 900, 1, 0.05, { titulo: 'HOSPITAIS CANCELAM CONSULTAS', jornal: 'NOTÍCIAS', data: '13 MAI 2017' }, 1);
  const tudo = g.textos.join(' ');
  for (const w of ['NOTÍCIAS', 'HOSPITAIS', 'CANCELAM', 'CONSULTAS', '13 MAI 2017']) assert.ok(tudo.includes(w), `faltou ${w} em: ${tudo}`);
});

test('data datilografada: p = 0 vazia; p = 1 completa, linha 2 em perigo', () => {
  let g = ctxFalso(); setCtx(g);
  dataDatilografada('12 MAI 2017', 'LONDRES · 14:20', 0);
  assert.equal(g.textos.join(''), '');
  g = ctxFalso(); setCtx(g);
  dataDatilografada('12 MAI 2017', 'LONDRES · 14:20', 1);
  assert.deepEqual(g.textos, ['12 MAI 2017', 'LONDRES · 14:20']);
  const l2 = g.chamadas.find((c) => c.nome === 'fillText' && c.args[0] === 'LONDRES · 14:20');
  assert.equal(l2.fillStyle, tema.cores.perigo);
});

test('ficha: rótulo e carimbo aparecem; carimbo em perigo', () => {
  const g = ctxFalso(); setCtx(g);
  ficha(540, 900, 1, 'CASO Nº 0512', 'NÃO RESOLVIDO', 1);
  assert.ok(g.textos.includes('CASO Nº 0512'));
  const c = g.chamadas.find((x) => x.nome === 'fillText' && x.args[0] === 'NÃO RESOLVIDO');
  assert.ok(c, 'carimbo não desenhado'); assert.equal(c.fillStyle, tema.cores.perigo);
});
