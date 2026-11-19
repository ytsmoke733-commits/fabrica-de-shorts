import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vagaDoIon, progressoDoIon, pontoDoIon } from '../kit/mundo/ions.mjs';

const perto = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const C = 8, N = 3, n = C * N;

test('vagaDoIon: cada íon tem uma vaga própria no cátodo e outra no ânodo (sem repetir)', () => {
  const cat = new Set(), ano = new Set();
  for (let i = 0; i < n; i++) {
    const v = vagaDoIon(i, C, N);
    assert.ok(v.coluna >= 0 && v.coluna < C && Number.isInteger(v.coluna), `coluna ${v.coluna}`);
    assert.ok(v.nivelCatodo >= 0 && v.nivelCatodo < N && v.nivelAnodo >= 0 && v.nivelAnodo < N);
    cat.add(`${v.coluna}:${v.nivelCatodo}`); ano.add(`${v.coluna}:${v.nivelAnodo}`);
  }
  assert.equal(cat.size, n); assert.equal(ano.size, n);
});

test('vagaDoIon: saem primeiro os de perto do separador, que vão para o fundo do ânodo', () => {
  // nível 0 = encostado no separador. Os C primeiros íons saem do nível 0 do cátodo e vão para o nível N-1 do ânodo.
  for (let i = 0; i < C; i++) { const v = vagaDoIon(i, C, N); assert.equal(v.nivelCatodo, 0); assert.equal(v.nivelAnodo, N - 1); }
  for (let i = n - C; i < n; i++) { const v = vagaDoIon(i, C, N); assert.equal(v.nivelCatodo, N - 1); assert.equal(v.nivelAnodo, 0); }
  // nenhum íon atravessa uma vaga ainda ocupada: quem sai depois, na mesma coluna, vem de mais fundo e para antes
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = vagaDoIon(i, C, N), b = vagaDoIon(j, C, N);
    if (a.coluna !== b.coluna) continue;
    assert.ok(b.nivelCatodo > a.nivelCatodo && b.nivelAnodo < a.nivelAnodo, `íons ${i} e ${j}`);
  }
});

test('vagaDoIon: as colunas de um mesmo nível saem embaralhadas (não varrem da esquerda para a direita)', () => {
  const cols = Array.from({ length: C }, (_, i) => vagaDoIon(i, C, N).coluna);
  assert.equal(new Set(cols).size, C);
  const emOrdem = cols.every((c, k) => k === 0 || c > cols[k - 1]);
  assert.ok(!emOrdem, `colunas ${cols}`);
});

test('progressoDoIon: carga 0 -> todos no cátodo; carga 1 -> todos no ânodo', () => {
  for (let i = 0; i < n; i++) {
    assert.equal(progressoDoIon(i, n, 0), 0);
    assert.equal(progressoDoIon(i, n, 1), 1);
    assert.equal(progressoDoIon(i, n, -0.2), 0);    // fora de [0, 1] fica preso nas pontas
    assert.equal(progressoDoIon(i, n, 1.3), 1);
  }
});

test('progressoDoIon: cresce com a carga, fica em [0, 1] e o íon i sai antes do i + 1', () => {
  for (let i = 0; i < n; i++) {
    let ant = 0;
    for (let k = 0; k <= 200; k++) {
      const p = progressoDoIon(i, n, k / 200);
      assert.ok(p >= 0 && p <= 1, `p = ${p}`);
      assert.ok(p >= ant - 1e-12, `íon ${i} voltou em carga ${k / 200}`);
      ant = p;
    }
  }
  for (const c of [0.1, 0.33, 0.5, 0.77]) for (let i = 0; i + 1 < n; i++) assert.ok(progressoDoIon(i, n, c) >= progressoDoIon(i + 1, n, c));
});

test('progressoDoIon: em meia carga, metade (± uma janela) já chegou e poucos estão no caminho', () => {
  const ps = Array.from({ length: n }, (_, i) => progressoDoIon(i, n, 0.5, 0.3));
  const chegou = ps.filter((p) => p === 1).length, saindo = ps.filter((p) => p > 0 && p < 1).length;
  assert.ok(chegou >= n * 0.25 && chegou <= n * 0.6, `chegaram ${chegou}`);
  assert.ok(saindo >= 1 && saindo <= Math.ceil(0.3 * n * 1.5), `no caminho ${saindo}`);
  // a média do progresso acompanha a carga (exata em 0, 0,5 e 1; no resto, erro menor que meia janela)
  const media = (c) => Array.from({ length: n }, (_, i) => progressoDoIon(i, n, c, 0.3)).reduce((s, p) => s + p, 0) / n;
  assert.ok(perto(media(0.5), 0.5, 1e-9), `média em 0,5: ${media(0.5)}`);
  for (const c of [0.1, 0.25, 0.75, 0.9]) assert.ok(Math.abs(media(c) - c) < 0.15, `carga ${c}: média ${media(c)}`);
});

test('progressoDoIon: suave nas pontas (sai e chega devagar)', () => {
  // íon 0 sai em carga 0: logo depois o progresso ainda é bem menor que linear
  const j = 0.3, c = 0.03;
  assert.ok(progressoDoIon(0, n, c, j) < (c / j) * 0.5);
  assert.ok(progressoDoIon(0, n, j / 2, j) > 0.45 && progressoDoIon(0, n, j / 2, j) < 0.55);
});

test('pontoDoIon: vai de a (p = 0) a b (p = 1); na mesma coluna anda em linha reta', () => {
  const a = [0.3, -0.4, 0.1], b = [0.3, 2.9, 0.1];
  assert.deepEqual(pontoDoIon(a, b, 0).map((v) => +v.toFixed(9)), a);
  assert.deepEqual(pontoDoIon(a, b, 1).map((v) => +v.toFixed(9)), b);
  for (const p of [0.1, 0.5, 0.9]) {
    const q = pontoDoIon(a, b, p);
    assert.ok(perto(q[0], 0.3) && perto(q[2], 0.1));
    assert.ok(q[1] > a[1] && q[1] < b[1]);
  }
  assert.ok(perto(pontoDoIon(a, b, 0.5)[1], (a[1] + b[1]) / 2));
  // colunas diferentes: sai e chega na vertical (x quase parado nas pontas) e cruza no meio
  const c = [0, 0, 0], d = [1, 3, 0];
  assert.ok(pontoDoIon(c, d, 0.05)[0] < 0.05 && pontoDoIon(c, d, 0.95)[0] > 0.95);
  assert.ok(perto(pontoDoIon(c, d, 0.5)[0], 0.5));
});
