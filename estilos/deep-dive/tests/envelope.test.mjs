import { test } from 'node:test'; import assert from 'node:assert/strict';
import { criarEnvelope, carregarEnvelope } from '../kit/envelope.mjs';
test('envelope interpola e é zero fora', () => { const e = criarEnvelope({ hz: 10, v: [0, 1, 0] }); assert.equal(e(0.05), 0.5); assert.equal(e(5), 0); assert.equal(e(-1), 0); });
test('sem env.json a boca não fala (zeros), sem lançar', async () => {
  globalThis.fetch = async () => ({ ok: false });
  const e = await carregarEnvelope('data/env.json'); assert.equal(e(1), 0);
});
