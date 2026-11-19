import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../kit/cartoes.mjs';

const CASOS = {
  login: { id: 'lg', titulo: 'Entrar', campo: 'Senha', valor: '123456', tEntrada: 0, tDigitos: [0.5, 0.7, 0.9, 1.1, 1.3, 1.5], tMostrar: 1.8 },
  ranking: { id: 'rk', titulo: 'Mais usadas', itens: [{ rotulo: '123456', valor: 100 }, { rotulo: 'admin', valor: 60 }], destaque: 0, tEntrada: 0, tDestaque: 1 },
  terminal: { id: 'tm', comando: '$ testar', de: 0, ate: 123457, rotulo: 'TENTATIVA', tInicio: 0.2, tFim: 2, tAchou: 2, textoAchou: 'ENCONTRADA' },
  regua: { id: 'rg', rotulo: 'TEMPO', max: 1, valor: 0.01, tInicio: 0.2, tFim: 1, selo: '< 1 s' },
  medidor: { id: 'md', titulo: 'Criar senha', palavras: ['cavalo', 'lua', 'panela', 'verde'], tPalavras: [0.2, 0.6, 1.0, 1.4], rotulos: ['FRACA', 'BOA', 'FORTE'] },
  painel: { id: 'pn', rotulo: 'batidas por dia', de: 0, ate: 100000, sufixo: '', tInicio: 0.2, tFim: 1.5, formato: 'pt-BR' },
  seguir: { id: 'sg', marca: 'Curiosidades', chamada: 'Seguir', tEntrada: 0, tClique: 1 },
};

for (const [nome, opts] of Object.entries(CASOS)) {
  test(`${nome} devolve css/html/js com ids prefixados e sem cor fixa`, () => {
    const p = K[nome](opts);
    for (const k of ['css', 'html', 'js']) assert.equal(typeof p[k], 'string', `${nome}.${k}`);
    assert.ok(p.html.includes(`id="${opts.id}`), `${nome}: ids prefixados`);
    assert.doesNotMatch(p.css, /#[0-9a-fA-F]{6}\b/, `${nome}: cor fixa no css`);
  });
}

test('painel formata o valor final em pt-BR', () => {
  assert.ok(K.painel(CASOS.painel).js.includes('100.000') || K.painel(CASOS.painel).html.includes('100.000'));
});

test('js de cada cartão é JavaScript válido', () => {
  for (const [nome, opts] of Object.entries(CASOS)) {
    assert.doesNotThrow(() => new Function('tl', 'gsap', '$', 'ZW', 'count', 'typeText', 'spring', 'pop', 'click', K[nome](opts).js), nome);
  }
});

// ---- execução do js gerado com tl/gsap/document falsos ----
import { HELPERS } from '../kit/base.mjs';
import { carregarTema } from '../kit/tema.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMA = carregarTema(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'temas', 'tema-a.json'));

function executar(js) {
  const els = new Map();
  const el = (id) => { if (!els.has(id)) els.set(id, { id, textContent: '', style: {} }); return els.get(id); };
  const sets = [];
  const tl = new Proxy({ set(e, v, t) { if (e && e.id !== undefined) sets.push({ e, v, t: t ?? 0, n: sets.length }); return tl; } }, { get: (o, k) => (k in o ? o[k] : () => tl) });
  const gsap = { set() {}, parseEase: () => (x) => x };
  const document = { getElementById: el, querySelector: (s) => el(s) };
  const getComputedStyle = () => ({ getPropertyValue: (n) => TEMA.cores[n.slice(2)] || '' });
  new Function('tl', 'gsap', 'document', 'getComputedStyle', `${HELPERS}\n${js}`)(tl, gsap, document, getComputedStyle);
  sets.sort((a, b) => a.t - b.t || a.n - b.n);
  for (const s of sets) if ('textContent' in s.v) s.e.textContent = s.v.textContent;
  return els;
}
const limpo = (s) => s.replace(/​/g, '');

test('formatarNumero formata em pt-BR', () => {
  assert.equal(K.formatarNumero(100000), '100.000');
  assert.equal(K.formatarNumero(123457), '123.457');
  assert.equal(K.formatarNumero(36500000), '36.500.000');
});

test('painel termina em 100.000 e terminal em 123.457 ao executar o js', () => {
  assert.equal(limpo(executar(K.painel(CASOS.painel).js).get('pn-num').textContent), '100.000');
  assert.equal(limpo(executar(K.terminal(CASOS.terminal).js).get('tm-num').textContent), '123.457');
});

test('painel com sufixo termina com o sufixo', () => {
  assert.equal(limpo(executar(K.painel({ ...CASOS.painel, ate: 36500000, sufixo: ' km' }).js).get('pn-num').textContent), '36.500.000 km');
});

test('cor do tema não resolvida lança erro claro', () => {
  const js = K.login(CASOS.login).js;
  const els = (id) => ({ id });
  assert.throws(() => new Function('tl', 'gsap', 'document', 'getComputedStyle', `${HELPERS}\n${js}`)(new Proxy({}, { get: () => () => ({}) }), { set() {}, parseEase: () => (x) => x }, { getElementById: els }, () => ({ getPropertyValue: () => '' })), /cor do tema não resolvida: --acento/);
});

test('régua com cor escolhida não usa o vermelho', () => {
  const r = K.regua({ id: 'rc', rotulo: 'dias', max: 10, valor: 0, tInicio: 0, tFim: 1, selo: '0', cor: 'acento' });
  assert.ok(!r.css.includes('var(--perigo)'));
  assert.ok(!r.js.includes("'perigo'"));
  assert.match(r.css, /var\(--acento\)/);
});
test('terminal começa com o comando vazio (digita depois do fade-in)', () => {
  const t = K.terminal({ id: 'tz', comando: 'demo --x', de: 0, ate: 999, rotulo: 'tentativas', tInicio: 1, tFim: 2, tAchou: 2, textoAchou: 'ok' });
  const set = t.js.indexOf("tl.set($('tz-cmd'), { textContent: ZW }, 0)");
  assert.ok(set >= 0 && set < t.js.indexOf("typeText($('tz-cmd')"));
});
