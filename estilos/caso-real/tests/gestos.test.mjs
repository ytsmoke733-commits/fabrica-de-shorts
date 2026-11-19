import { test } from 'node:test'; import assert from 'node:assert/strict';
import { GESTOS, acenoNoTempo, cocadaNoTempo } from '../kit/personagem/gestos.mjs';
test('gestos pedidos pela spec, com formato completo', () => {
  for (const n of ['repouso', 'garganta', 'barriga', 'cocarCabeca', 'apontar', 'acenar']) {
    const g = GESTOS[n]; assert.ok(g, n);
    assert.ok(['L', 'R'].includes(g.lado)); assert.ok(['head', 'spine'].includes(g.osso));
    for (const k of ['alvo', 'dedos', 'palma']) assert.equal(g[k].length, 3, `${n}.${k}`);
  }
  assert.equal(GESTOS.apontar.preset, 'point'); assert.equal(GESTOS.cocarCabeca.preset, 'scratch');
});
test('aceno e coçada oscilam', () => { assert.notEqual(acenoNoTempo(0), acenoNoTempo(0.17)); assert.notEqual(cocadaNoTempo(0), cocadaNoTempo(0.1)); });
import { gestoNoLado } from '../kit/personagem/gestos.mjs';
test('gestoNoLado: mesmo lado devolve igual; lado oposto espelha x de alvo, dedos, palma e pole', () => {
  const g = GESTOS.garganta;
  assert.deepEqual(gestoNoLado(g, g.lado), g);
  const r = gestoNoLado(g, 'R');
  assert.equal(r.lado, 'R'); assert.equal(r.osso, g.osso); assert.equal(r.preset, g.preset);
  for (const k of ['alvo', 'dedos', 'palma', 'pole']) assert.deepEqual(r[k], [-g[k][0], g[k][1], g[k][2]], k);
  assert.deepEqual(gestoNoLado(r, 'L'), g, 'espelhar duas vezes volta ao original');
  assert.equal(GESTOS.garganta.lado, 'L', 'não altera o original');
});
test('gestoNoLado: pole é opcional e lado inválido lança', () => {
  const semPole = { ...GESTOS.apontar }; delete semPole.pole;
  assert.equal('pole' in gestoNoLado(semPole, 'L'), false);
  assert.throws(() => gestoNoLado(GESTOS.apontar, 'X'), /lado "X" inválido/);
});
test('gestos portados do v2 trazem o pole do cotovelo (rest/throat/belly)', () => {
  for (const n of ['repouso', 'garganta', 'barriga']) assert.equal(GESTOS[n].pole.length, 3, n);
});
