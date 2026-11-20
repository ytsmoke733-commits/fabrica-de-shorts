import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { rodarLote, entregarVideo } from '../lib/lote.mjs';
import { adicionar, mudarEtapa, lerFila } from '../lib/fila.mjs';

const SCRIPT_OK = {
  lang: 'pt', gancho: 'g', sources: ['fonte'], lead: 0.35, outro: 1, gap: 0.26,
  postar: { titulo: 'T', descricao: 'D', hashtags: ['x'] },
  lines: [
    { text: 'olha isso aqui', caps: 'olha *isso aqui' },
    { text: 'mais um pouco', caps: 'mais *um pouco' },
    { text: 'segue', caps: '*segue', variantes: { tiktok: { text: 'segue', caps: '*segue' }, shorts: { text: 'se inscreve', caps: 'se *inscreve' } } },
  ],
};

function raiz(script) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-l-'));
  fs.mkdirSync(path.join(root, 'marcas', 'conhecimento'), { recursive: true });
  fs.writeFileSync(path.join(root, 'marcas', 'conhecimento', 'marca.json'), JSON.stringify({
    id: 'conhecimento', nome: 'C', nicho: 'n', perfis: { tiktok: 'p', youtube: 'p' }, estilos: ['deep-dive'], voz: 'pm_alex', proibido: [] }));
  const rel = path.join('marcas', 'conhecimento', 'videos', 'v1');
  const dir = path.join(root, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify(script));
  fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ id: 'v1', marca: 'conhecimento', estilo: 'deep-dive', motor: 'fs3d' }));
  adicionar(root, { id: 'v1', marca: 'conhecimento', estilo: 'deep-dive', dir: rel });
  mudarEtapa(root, 'v1', 'render');
  return { root, dir };
}

const fakeRun = (duracao, { ffmpegCode = 0, chamadas = [] } = {}) => async (cmd, args) => {
  chamadas.push({ cmd, args });
  if (cmd === 'ffprobe') return { code: 0, out: String(duracao) };
  if (cmd === 'ffmpeg') {
    if (ffmpegCode !== 0 && !args.includes('-vf')) return { code: ffmpegCode, out: 'ffmpeg quebrou' };
    fs.writeFileSync(args[args.length - 1], 'jpg');
    return { code: 0, out: '' };
  }
  return { code: 0, out: args.includes('check') ? 'CHECK OK' : '' };
};

test('lote entrega o vídeo válido com postar.md e marca entregue', async () => {
  const { root, dir } = raiz(SCRIPT_OK);
  const r = await rodarLote(root, { run: fakeRun(30.2), log: () => {} });
  assert.equal(r[0].ok, true);
  assert.deepEqual(r[0].arquivos, ['tiktok.mp4 (30.2 s)', 'shorts.mp4 (30.2 s)']);
  assert.ok(fs.existsSync(path.join(dir, 'entrega', 'postar.md')));
  assert.equal(lerFila(root)[0].etapa, 'entregue');
});

test('lote recusa roteiro inválido e mantém em render com o erro', async () => {
  const { root } = raiz({ ...SCRIPT_OK, gancho: '' });
  const r = await rodarLote(root, { run: fakeRun(30), log: () => {} });
  assert.equal(r[0].ok, false);
  const v = lerFila(root)[0];
  assert.equal(v.etapa, 'render');
  assert.match(v.erro, /gancho/);
});

test('lote recusa vídeo renderizado acima do limite', async () => {
  const { root } = raiz(SCRIPT_OK);
  const r = await rodarLote(root, { run: fakeRun(47.3), log: () => {} });
  assert.equal(r[0].ok, false);
  assert.match(r[0].erro, /shorts\.mp4 tem 47\.3 s/);
});

test('lote aceita vídeo até o limite_s do roteiro (shorts de 47,3 s com limite_s 50)', async () => {
  const { root } = raiz({ ...SCRIPT_OK, limite_s: 50 });
  const r = await rodarLote(root, { run: fakeRun(47.3), log: () => {} });
  assert.equal(r[0].ok, true, r[0].erro);
});

test('limite_s nunca passa de 60 s no lote', async () => {
  const { root } = raiz({ ...SCRIPT_OK, limite_s: 90 });
  const r = await rodarLote(root, { run: fakeRun(61), log: () => {} });
  assert.equal(r[0].ok, false);
  assert.match(r[0].erro, /61\.0 s \(limite 60 s\)/);
});

test('lote falha quando a capa não é gerada (ffmpeg code 1)', async () => {
  const { root } = raiz(SCRIPT_OK);
  const r = await rodarLote(root, { run: fakeRun(30, { ffmpegCode: 1 }), log: () => {} });
  assert.equal(r[0].ok, false);
  assert.match(r[0].erro, /capa/);
  assert.equal(lerFila(root)[0].etapa, 'render');
});

test('entregarVideo com so rejeita plataforma que não pertence à marca', async () => {
  const { root } = raiz(SCRIPT_OK);
  const item = lerFila(root)[0];
  await assert.rejects(entregarVideo(root, item, { run: fakeRun(30), so: ['reels'] }), /não pertence/);
});

test('entregarVideo com so gera a capa a partir do mp4 renderizado', async () => {
  const { root, dir } = raiz(SCRIPT_OK);
  const item = lerFila(root)[0];
  const chamadas = [];
  const arquivos = await entregarVideo(root, item, { run: fakeRun(30, { chamadas }), so: ['shorts'] });
  assert.deepEqual(arquivos, ['shorts.mp4 (30.0 s)']);
  const capa = chamadas.find((c) => c.cmd === 'ffmpeg');
  assert.ok(capa.args.includes(path.join(dir, 'entrega', 'shorts.mp4')));
  assert.ok(fs.existsSync(path.join(dir, 'entrega', 'capa.jpg')));
});

test('entregarVideo gera folha-<plataforma>.jpg fora de entrega/ e falha se ffmpeg da folha falhar', async () => {
  const { root, dir } = raiz(SCRIPT_OK);
  const item = lerFila(root)[0];
  await entregarVideo(root, item, { run: fakeRun(30), so: ['shorts', 'tiktok'] });
  assert.ok(fs.existsSync(path.join(dir, 'folha-shorts.jpg')));
  assert.ok(fs.existsSync(path.join(dir, 'folha-tiktok.jpg')));
  assert.ok(!fs.existsSync(path.join(dir, 'entrega', 'folha-shorts.jpg')));
  const falha = async (cmd, args) => (cmd === 'ffmpeg' && args.includes('-vf') ? { code: 1, out: 'sem folha' } : fakeRun(30)(cmd, args));
  await assert.rejects(entregarVideo(root, item, { run: falha, so: ['shorts'] }), /folha falhou: .*sem folha/);
});

test('lote barra vídeo que importa de estilos/ antes de renderizar', async () => {
  const { root, dir } = raiz(SCRIPT_OK);
  fs.writeFileSync(path.join(dir, 'gen.mjs'), "import { x } from '../../../estilos/voxel/kit/voxel.mjs';");
  const chamadas = [];
  const r = await rodarLote(root, { run: fakeRun(30, { chamadas }), log: () => {} });
  assert.equal(r[0].ok, false);
  assert.match(r[0].erro, /checagem:/);
  assert.match(r[0].erro, /importa de fora do vídeo/);
  assert.equal(lerFila(root)[0].etapa, 'render');
  assert.deepEqual(chamadas, []);
});
