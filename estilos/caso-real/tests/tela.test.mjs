import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { usarTemaEvidencias } from '../kit/evidencias.mjs';
import { desenharTela } from '../kit/tela.mjs';
import { TERMOS_PROIBIDOS } from '../kit/codigo.mjs';
import { ctxFalso } from './ctx-falso.mjs';

const tema = JSON.parse(readFileSync(new URL('../temas/tema.json', import.meta.url), 'utf8'));
usarTemaEvidencias(tema);
const chave = (o) => desenharTela(ctxFalso(), 1080, 1920, o);

test('chave do conteúdo: estável, muda com as letras digitadas e com o cursor', () => {
  assert.equal(typeof chave({ seed: 3, k: 0.5 }), 'string');
  assert.equal(chave({ seed: 3, k: 0.5, t: 0 }), chave({ seed: 3, k: 0.5, t: 0.1 }));   // cursor ainda aceso
  assert.notEqual(chave({ seed: 3, k: 0.5, t: 0 }), chave({ seed: 3, k: 0.5, t: 0.5 })); // cursor apagou
  assert.notEqual(chave({ seed: 3, k: 0.5 }), chave({ seed: 3, k: 0.6 }));
  assert.notEqual(chave({ seed: 3, k: 1 }), chave({ seed: 4, k: 1 }));
  assert.notEqual(chave({ seed: 3, k: 1 }), chave({ seed: 3, k: 1, alerta: 'ok', kAlerta: 1 }));
});

test('a tela só escreve código do vocabulário (nada da lista proibida)', () => {
  for (const seed of [1, 2, 7, 42]) {
    const g = ctxFalso(); desenharTela(g, 1080, 1920, { seed, linhas: 20, k: 1, alerta: 'invasao', kAlerta: 1 });
    for (const s of g.textos) for (const re of TERMOS_PROIBIDOS) assert.ok(!re.test(s), `"${s}" casa com ${re}`);
  }
});

test('alerta: bloqueado em perigo, ok em destaque; k = 0 digita nada', () => {
  const cor = (alerta, palavra) => {
    const g = ctxFalso(); desenharTela(g, 1080, 1920, { k: 1, alerta, kAlerta: 1 });
    const c = g.chamadas.find((x) => x.nome === 'fillText' && x.args[0].includes(palavra));
    assert.ok(c, `faltou "${palavra}"`); return c.fillStyle;
  };
  assert.equal(cor('bloqueado', 'BLOQUEADOS'), tema.cores.perigo);
  assert.equal(cor('invasao', 'AUTORIZADO'), tema.cores.perigo);
  assert.equal(cor('ok', 'ATUALIZADO'), tema.cores.destaque);
  const g = ctxFalso(); desenharTela(g, 1080, 1920, { k: 0 });
  assert.equal(g.textos.join('').trim(), '');
  assert.throws(() => desenharTela(ctxFalso(), 100, 100, { alerta: 'pânico', kAlerta: 1 }), /pânico/);
});
