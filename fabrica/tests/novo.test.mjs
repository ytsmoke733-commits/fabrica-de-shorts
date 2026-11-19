import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { novoVideo } from '../lib/novo.mjs';
import { lerFila } from '../lib/fila.mjs';

function raizFalsa() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-'));
  fs.mkdirSync(path.join(root, 'marcas', 'conhecimento'), { recursive: true });
  fs.writeFileSync(path.join(root, 'marcas', 'conhecimento', 'marca.json'), JSON.stringify({
    id: 'conhecimento', nome: 'C', nicho: 'n', perfis: { tiktok: 'p', youtube: 'p' }, estilos: ['deep-dive', 'motion'], voz: 'pm_alex', proibido: [] }));
  const base = path.join(root, 'estilos', 'deep-dive'), m = path.join(base, 'modelo');   // modelo, kit e tema do estilo deep-dive
  fs.mkdirSync(path.join(m, 'src'), { recursive: true });
  fs.mkdirSync(path.join(base, 'kit'), { recursive: true });
  fs.mkdirSync(path.join(base, 'temas'), { recursive: true });
  fs.writeFileSync(path.join(base, 'kit', 'tempo.mjs'), '// kit');
  fs.writeFileSync(path.join(base, 'temas', 'tema.json'), '{"nome":"tema"}');
  fs.mkdirSync(path.join(m, 'data'), { recursive: true });
  fs.mkdirSync(path.join(m, 'renders'), { recursive: true });
  fs.writeFileSync(path.join(m, 'src', 'cenas.js'), '// cenas');
  fs.writeFileSync(path.join(m, 'data', 'narration.wav'), 'x');
  fs.writeFileSync(path.join(m, 'renders', 'v.mp4'), 'x');
  fs.writeFileSync(path.join(m, 'script.json'), JSON.stringify({ title: 'velho', voice: 'pf_dora', lines: [{ text: 'a' }] }));
  return root;
}

test('cria o vídeo copiando o modelo sem mídia e entra na fila', () => {
  const root = raizFalsa();
  const { id, dir } = novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'teste-um', data: new Date('2026-11-20T12:00:00Z') });
  assert.equal(id, '2026-11-20-teste-um');
  assert.ok(fs.existsSync(path.join(dir, 'src', 'cenas.js')));
  assert.ok(fs.existsSync(path.join(dir, 'kit', 'tempo.mjs')));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'tema.json'), 'utf8')), { nome: 'tema' });
  assert.ok(!fs.existsSync(path.join(dir, 'data')));
  assert.ok(!fs.existsSync(path.join(dir, 'renders')));
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
  assert.equal(s.lang, 'pt');
  assert.equal(s.voice, 'pm_alex');
  assert.equal(s.marca_nome, 'C');
  assert.deepEqual(s.postar, { titulo: '', descricao: '', hashtags: [] });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8')), { id, marca: 'conhecimento', estilo: 'deep-dive', motor: 'fs3d' });
  assert.equal(lerFila(root)[0].etapa, 'roteiro');
});

test('recusa estilo de fora da marca, slug inválido e estilo sem modelo', () => {
  const root = raizFalsa();
  assert.throws(() => novoVideo(root, { marca: 'conhecimento', estilo: 'motion-b', slug: 'x' }), /não é permitido/);
  assert.throws(() => novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'Com Espaço' }), /slug/);
  fs.writeFileSync(path.join(root, 'marcas', 'conhecimento', 'marca.json'), JSON.stringify({
    id: 'conhecimento', nome: 'C', nicho: 'n', perfis: { tiktok: 'p' }, estilos: ['estilo-sem-modelo'], voz: 'pm_alex', proibido: [] }));
  assert.throws(() => novoVideo(root, { marca: 'conhecimento', estilo: 'estilo-sem-modelo', slug: 'x' }), /sem modelo/);
});

test('falha no meio não deixa pasta órfã nem item na fila', () => {
  const root = raizFalsa();
  fs.rmSync(path.join(root, 'estilos', 'deep-dive', 'modelo', 'script.json'));
  assert.throws(() => novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'quebrado', data: new Date('2026-11-20T12:00:00Z') }));
  assert.ok(!fs.existsSync(path.join(root, 'marcas', 'conhecimento', 'videos', '2026-11-20-quebrado')));
  assert.deepEqual(lerFila(root), []);
});

test('modelo do estilo ausente é erro claro e não cria pasta', () => {
  const root = raizFalsa();
  fs.rmSync(path.join(root, 'estilos', 'deep-dive', 'modelo'), { recursive: true });
  assert.throws(() => novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'sem-modelo' }), /modelo do estilo deep-dive não encontrado: estilos\/deep-dive\/modelo/);
  assert.ok(!fs.existsSync(path.join(root, 'marcas', 'conhecimento', 'videos')));
});

test('id usa a data local, não a UTC', () => {
  const root = raizFalsa();
  const { id } = novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'noite', data: new Date(2026, 0, 5, 22, 0) });
  assert.equal(id, '2026-01-05-noite');
});

test('o @ da marca vai para o roteiro (marca_arroba); sem @ na marca, fica de fora', () => {
  const root = raizFalsa();
  const f = path.join(root, 'marcas', 'conhecimento', 'marca.json');
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(f, JSON.stringify({ ...m, arroba: '@meucanal' }));
  const { dir } = novoVideo(root, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'com-arroba', data: new Date('2026-11-20T12:00:00Z') });
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8')).marca_arroba, '@meucanal');
  const r2 = raizFalsa();
  const { dir: d2 } = novoVideo(r2, { marca: 'conhecimento', estilo: 'deep-dive', slug: 'sem-arroba', data: new Date('2026-11-20T12:00:00Z') });
  assert.ok(!('marca_arroba' in JSON.parse(fs.readFileSync(path.join(d2, 'script.json'), 'utf8'))));
});
