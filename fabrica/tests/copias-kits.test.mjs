import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Vigia das cópias de código entre os kits motion, voxel e deep-dive: elas devem ficar iguais.
const lerKit = (rel) => readFileSync(fileURLToPath(new URL(`../../estilos/${rel}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

function corpoDaFuncao(texto, nome, arquivo) {
  const ini = texto.indexOf(`function ${nome}`);
  assert.ok(ini >= 0, `${arquivo}: função ${nome} não encontrada`);
  const abre = texto.indexOf('{', ini);
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}' && --nivel === 0) return texto.slice(ini, i + 1);
  }
  assert.fail(`${arquivo}: não achei a chave que fecha ${nome}`);
}

const AVISO = 'As cópias entre os kits motion, voxel, deep-dive, caso-real, pixel e mapa-satelite devem ficar iguais: mexeu numa, mexa na outra.';

test('numeros.mjs igual nos kits motion e voxel (fora o comentário "Cópia de…")', () => {
  const motion = lerKit('motion/kit/numeros.mjs');
  const voxel = lerKit('voxel/kit/numeros.mjs').split('\n').slice(1).join('\n');
  assert.equal(voxel, motion, `estilos/voxel/kit/numeros.mjs divergiu de estilos/motion/kit/numeros.mjs. ${AVISO}`);
});

test('gruposDaLinha igual em legendas.mjs dos kits motion e voxel', () => {
  const motion = corpoDaFuncao(lerKit('motion/kit/legendas.mjs'), 'gruposDaLinha', 'motion/kit/legendas.mjs');
  const voxel = corpoDaFuncao(lerKit('voxel/kit/legendas.mjs'), 'gruposDaLinha', 'voxel/kit/legendas.mjs');
  assert.equal(voxel, motion, `gruposDaLinha em estilos/voxel/kit/legendas.mjs divergiu de estilos/motion/kit/legendas.mjs. ${AVISO}`);
});

test('numeros.mjs igual nos kits motion e deep-dive (fora o comentário "Cópia de…")', () => {
  const motion = lerKit('motion/kit/numeros.mjs');
  const deep = lerKit('deep-dive/kit/numeros.mjs').split('\n').slice(1).join('\n');
  assert.equal(deep, motion, `estilos/deep-dive/kit/numeros.mjs divergiu de estilos/motion/kit/numeros.mjs. ${AVISO}`);
});

test('numeros.mjs igual nos kits motion e caso-real (fora o comentário "Cópia de…")', () => {
  const motion = lerKit('motion/kit/numeros.mjs');
  const caso = lerKit('caso-real/kit/numeros.mjs').split('\n').slice(1).join('\n');
  assert.equal(caso, motion, `estilos/caso-real/kit/numeros.mjs divergiu de estilos/motion/kit/numeros.mjs. ${AVISO}`);
});

test('gruposDaLinha igual em legendas.mjs dos kits motion e deep-dive', () => {
  const motion = corpoDaFuncao(lerKit('motion/kit/legendas.mjs'), 'gruposDaLinha', 'motion/kit/legendas.mjs');
  const deep = corpoDaFuncao(lerKit('deep-dive/kit/legendas.mjs'), 'gruposDaLinha', 'deep-dive/kit/legendas.mjs');
  assert.equal(deep, motion, `gruposDaLinha em estilos/deep-dive/kit/legendas.mjs divergiu de estilos/motion/kit/legendas.mjs. ${AVISO}`);
});

test('gruposDaLinha igual em legendas.mjs dos kits motion e caso-real', () => {
  const motion = corpoDaFuncao(lerKit('motion/kit/legendas.mjs'), 'gruposDaLinha', 'motion/kit/legendas.mjs');
  const caso = corpoDaFuncao(lerKit('caso-real/kit/legendas.mjs'), 'gruposDaLinha', 'caso-real/kit/legendas.mjs');
  assert.equal(caso, motion, `gruposDaLinha em estilos/caso-real/kit/legendas.mjs divergiu de estilos/motion/kit/legendas.mjs. ${AVISO}`);
});

test('cameras.mjs igual nos kits voxel e deep-dive (fora o comentário da 1ª linha)', () => {
  const voxel = lerKit('voxel/kit/cameras.mjs').split('\n').slice(1).join('\n');
  const deep = lerKit('deep-dive/kit/cameras.mjs').split('\n').slice(1).join('\n');
  assert.equal(deep, voxel, `estilos/deep-dive/kit/cameras.mjs divergiu de estilos/voxel/kit/cameras.mjs. ${AVISO}`);
});

// Cópias do caso-real vs deep-dive: iguais byte a byte (nada cortado).
for (const arq of ['cameras.mjs', 'tempo.mjs', 'tema.mjs', 'motor/lib.js', 'motor/engine.js', 'motor/sdf.js', 'personagem/humano.js', 'personagem/poses.mjs', 'personagem/gestos.mjs']) {
  test(`${arq} igual nos kits deep-dive e caso-real`, () => {
    assert.equal(lerKit(`caso-real/kit/${arq}`), lerKit(`deep-dive/kit/${arq}`), `estilos/caso-real/kit/${arq} divergiu de estilos/deep-dive/kit/${arq}. ${AVISO}`);
  });
}

// capture.mjs do modelo e a parte do hud.mjs a partir de `pilula` (antes dela ficam os ícones, só do caso-real): iguais ao deep-dive.
test('modelo/tools/capture.mjs igual nos kits deep-dive e caso-real', () => {
  assert.equal(lerKit('caso-real/modelo/tools/capture.mjs'), lerKit('deep-dive/modelo/tools/capture.mjs'), `estilos/caso-real/modelo/tools/capture.mjs divergiu de estilos/deep-dive/modelo/tools/capture.mjs. ${AVISO}`);
});

test('hud.mjs igual nos kits deep-dive e caso-real a partir de `export function pilula`', () => {
  const desde = (txt, arq) => { const i = txt.indexOf('export function pilula'); assert.ok(i >= 0, `${arq}: export function pilula não encontrada`); return txt.slice(i); };
  assert.equal(desde(lerKit('caso-real/kit/hud.mjs'), 'caso-real/kit/hud.mjs'), desde(lerKit('deep-dive/kit/hud.mjs'), 'deep-dive/kit/hud.mjs'), `estilos/caso-real/kit/hud.mjs divergiu de estilos/deep-dive/kit/hud.mjs (a partir de pilula). ${AVISO}`);
});

// Motor, tempo e tema: o deep-dive copiou do voxel. Só a 1ª linha de comentário de tema.mjs difere ("Tema do deep-dive" x "Tema do voxel").
const semPrimeira = (txt) => txt.split('\n').slice(1).join('\n');
for (const [arq, ignoraPrimeira] of [['motor/lib.js', false], ['motor/engine.js', false], ['tempo.mjs', false], ['tema.mjs', true]]) {
  test(`${arq} igual nos kits voxel e deep-dive${ignoraPrimeira ? ' (fora o comentário da 1ª linha)' : ''}`, () => {
    const cortar = ignoraPrimeira ? semPrimeira : (x) => x;
    const voxel = cortar(lerKit(`voxel/kit/${arq}`)), deep = cortar(lerKit(`deep-dive/kit/${arq}`));
    assert.equal(deep, voxel, `estilos/deep-dive/kit/${arq} divergiu de estilos/voxel/kit/${arq}. ${AVISO}`);
  });
}

// Cópias do pixel: numeros e gruposDaLinha (vs motion); cameras, tempo (fora a 1ª/2ª linha de comentário), lib.js, capture.mjs e mix.py (vs voxel).
test('numeros.mjs igual nos kits motion e pixel (fora o comentário "Cópia de…")', () => {
  assert.equal(semPrimeira(lerKit('pixel/kit/numeros.mjs')), lerKit('motion/kit/numeros.mjs'), `estilos/pixel/kit/numeros.mjs divergiu de estilos/motion/kit/numeros.mjs. ${AVISO}`);
});
test('gruposDaLinha igual em legendas.mjs dos kits motion e pixel', () => {
  const motion = corpoDaFuncao(lerKit('motion/kit/legendas.mjs'), 'gruposDaLinha', 'motion/kit/legendas.mjs');
  const pixel = corpoDaFuncao(lerKit('pixel/kit/legendas.mjs'), 'gruposDaLinha', 'pixel/kit/legendas.mjs');
  assert.equal(pixel, motion, `gruposDaLinha em estilos/pixel/kit/legendas.mjs divergiu de estilos/motion/kit/legendas.mjs. ${AVISO}`);
});
test('cameras.mjs igual nos kits voxel e pixel (fora o comentário da 1ª linha)', () => {
  const sem1 = (r) => semPrimeira(lerKit(r));
  assert.equal(sem1('pixel/kit/cameras.mjs'), sem1('voxel/kit/cameras.mjs'), `estilos/pixel/kit/cameras.mjs divergiu de estilos/voxel/kit/cameras.mjs. ${AVISO}`);
});
test('tempo.mjs igual nos kits voxel e pixel (fora as 2 linhas de comentário)', () => {
  const sem2 = (r) => semPrimeira(semPrimeira(lerKit(r)));
  assert.equal(sem2('pixel/kit/tempo.mjs'), sem2('voxel/kit/tempo.mjs'), `estilos/pixel/kit/tempo.mjs divergiu de estilos/voxel/kit/tempo.mjs. ${AVISO}`);
});
for (const arq of ['kit/motor/lib.js', 'kit/mundo/camera3d.js', 'modelo/tools/capture.mjs', 'modelo/tools/mix.py']) {
  test(`${arq} igual nos kits voxel e pixel`, () => {
    assert.equal(lerKit(`pixel/${arq}`), lerKit(`voxel/${arq}`), `estilos/pixel/${arq} divergiu de estilos/voxel/${arq}. ${AVISO}`);
  });
}

// Cópias do mapa-satelite: o kit reaproveita peças do voxel e do pixel sem mudar nada (o código novo é só kit/mapa/).
const MAPA_DO_VOXEL = ['kit/cameras.mjs', 'kit/hud.mjs', 'kit/legendas.mjs', 'kit/tema.mjs', 'kit/tempo.mjs', 'kit/motor/engine.js',
  ...['blocos.js', 'efeitos.js', 'elenco.js', 'espaco.js', 'orla.js', 'pessoa.js', 'poses.mjs', 'props.js', 'rostos.mjs', 'rua.js', 'sala.js', 'trafego.mjs'].map((a) => `kit/mundo/${a}`)];
const MAPA_DO_PIXEL = ['kit/numeros.mjs', 'kit/motor/lib.js', 'kit/mundo/camera3d.js', 'modelo/tools/capture.mjs', 'modelo/tools/mix.py'];
for (const [origem, lista] of [['voxel', MAPA_DO_VOXEL], ['pixel', MAPA_DO_PIXEL]]) {
  for (const arq of lista) {
    test(`${arq} igual nos kits ${origem} e mapa-satelite`, () => {
      assert.equal(lerKit(`mapa-satelite/${arq}`), lerKit(`${origem}/${arq}`), `estilos/mapa-satelite/${arq} divergiu de estilos/${origem}/${arq}. ${AVISO}`);
    });
  }
}
