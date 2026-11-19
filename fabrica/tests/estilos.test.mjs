import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESTILOS, estilosComKit } from '../lib/estilos.mjs';

test('motion-b usa o kit motion com tema B e modelo próprio', () => {
  assert.deepEqual(ESTILOS['motion-b'], { motor: 'hyperframes', modelo: 'estilos/motion/modelo-b', kit: 'estilos/motion/kit', tema: 'tema-b' });
});

test('voxel usa o kit voxel com o tema do voxel', () => {
  assert.deepEqual(ESTILOS.voxel, { motor: 'fs3d', modelo: 'estilos/voxel/modelo', kit: 'estilos/voxel/kit', tema: 'tema' });
});

test('deep-dive usa o kit deep-dive', () => assert.deepEqual(ESTILOS['deep-dive'], { motor: 'fs3d', modelo: 'estilos/deep-dive/modelo', kit: 'estilos/deep-dive/kit', tema: 'tema' }));

test('caso-real usa o kit caso-real', () => assert.deepEqual(ESTILOS['caso-real'], { motor: 'fs3d', modelo: 'estilos/caso-real/modelo', kit: 'estilos/caso-real/kit', tema: 'tema' }));

test('pixel usa o kit pixel', () => assert.deepEqual(ESTILOS.pixel, { motor: 'fs3d', modelo: 'estilos/pixel/modelo', kit: 'estilos/pixel/kit', tema: 'tema' }));

test('estilosComKit lista os estilos com kit (todos, deep-dive incluído)', () => {
  const ids = estilosComKit();
  assert.ok(ids.includes('motion') && ids.includes('motion-b') && ids.includes('voxel'));
  assert.ok(ids.includes('deep-dive') && ids.includes('caso-real') && ids.includes('pixel'));
  assert.deepEqual(ids.sort(), Object.keys(ESTILOS).sort());
  for (const id of Object.keys(ESTILOS)) assert.ok(ESTILOS[id].kit, `${id} sem kit`);
});
