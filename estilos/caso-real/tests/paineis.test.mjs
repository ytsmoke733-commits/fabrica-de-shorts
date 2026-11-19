import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setCtx } from '../kit/motor/lib.js';
import { usarTemaEvidencias } from '../kit/evidencias.mjs';
import { pontosDoMapa, mapaMundi, linhaDoTempo } from '../kit/paineis.mjs';
import { ehTerra } from '../kit/mapa.mjs';
import { ctxFalso } from './ctx-falso.mjs';

const tema = JSON.parse(readFileSync(new URL('../temas/tema.json', import.meta.url), 'utf8'));
usarTemaEvidencias(tema);
const caixa = { x: 40, y: 520, w: 1000, h: 520 };

test('pontos do mapa: grade de 14 px dentro da caixa, só onde é terra, determinística', () => {
  const pts = pontosDoMapa(caixa, 14);
  assert.ok(pts.length > 500 && pts.length < 2000, `${pts.length} pontos`);
  assert.deepEqual(pts, pontosDoMapa(caixa, 14));
  for (const [x, y] of pts) {
    assert.ok(x >= caixa.x && x <= caixa.x + caixa.w && y >= caixa.y && y <= caixa.y + caixa.h, `${x},${y}`);
    const lon = ((x - caixa.x) / caixa.w) * 360 - 180, lat = 90 - ((y - caixa.y) / caixa.h) * 150;
    assert.ok(ehTerra([lon, lat]), `${lon},${lat} não é terra`);
  }
});

test('mapa: cidade desconhecida lança erro claro', () => {
  setCtx(ctxFalso());
  assert.throws(() => mapaMundi({ conexoes: [['Londres', 'Atlântida']] }), /Atlântida/);
  assert.throws(() => mapaMundi({ foco: 'Gotham' }), /Gotham/);
});

test('mapa: conexões em perigo só aparecem com p > 0; foco ganha rótulo', () => {
  const vermelhos = (p) => { const g = ctxFalso(); setCtx(g); mapaMundi({ conexoes: [['Londres', 'Moscou']], p, foco: 'Londres' }); return g; };
  assert.equal(vermelhos(0).chamadas.filter((c) => c.nome === 'stroke' && c.strokeStyle === tema.cores.perigo).length, 0);
  const g = vermelhos(1);
  assert.ok(g.chamadas.some((c) => c.nome === 'stroke' && c.strokeStyle === tema.cores.perigo));
  assert.ok(g.textos.some((s) => /LONDRES/.test(s)));
});

test('linha do tempo respeita o alfa de quem chama e o devolve', () => {
  const eventos = [{ data: '14 MAR 2017', rotulo: 'correção' }, { data: '12 MAI 2017', rotulo: 'ataque' }];
  const g = ctxFalso(); setCtx(g); g.globalAlpha = 0.5; linhaDoTempo({ eventos, p: 1, atual: 1 });
  const desenhos = g.chamadas.filter((c) => c.nome === 'fillText' || c.nome === 'fill');
  assert.ok(desenhos.length > 0 && g.textos.includes('correção'));
  assert.ok(desenhos.every((c) => c.alpha <= 0.5 + 1e-9), 'algum desenho passou do alfa de quem chama');
  assert.equal(g.globalAlpha, 0.5);
});

test('linha do tempo: p = 0 sem datas; p = 1 com todas; marco atual em perigo', () => {
  const eventos = [{ data: '14 MAR 2017', rotulo: 'correção' }, { data: '12 MAI 2017', rotulo: 'ataque' }, { data: '13 MAI 2017', rotulo: 'parado' }];
  let g = ctxFalso(); setCtx(g); linhaDoTempo({ eventos, p: 0, atual: 1 });
  assert.equal(g.textos.join(''), '');
  g = ctxFalso(); setCtx(g); linhaDoTempo({ eventos, p: 1, atual: 1 });
  for (const e of eventos) { assert.ok(g.textos.includes(e.data), e.data); assert.ok(g.textos.includes(e.rotulo), e.rotulo); }
  assert.ok(g.chamadas.some((c) => c.nome === 'fill' && c.fillStyle === tema.cores.perigo));
});
