import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { testarKits } from '../lib/kits.mjs';
import { ESTILOS } from '../lib/estilos.mjs';
import { lerFila } from '../lib/fila.mjs';

const SCRIPT = { lang: 'pt', gancho: 'g', sources: ['f'], lead: 0.2, outro: 0.5, gap: 0.2, postar: { titulo: 't', descricao: 'd', hashtags: ['x'] },
  lines: [{ text: 'um dois três' }, { text: 'quatro cinco' }, { text: 'segue', variantes: { tiktok: { text: 'Segue pra mais.' }, shorts: { text: 'Se inscreve pra mais.' } } }] };

function raiz() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-k-'));
  fs.mkdirSync(path.join(root, 'marcas', 'conhecimento'), { recursive: true });
  fs.writeFileSync(path.join(root, 'marcas', 'conhecimento', 'marca.json'), JSON.stringify({ id: 'conhecimento', nome: 'C', nicho: 'n', perfis: { tiktok: 'p', youtube: 'p' }, estilos: ['__k'], voz: 'pm_alex', proibido: [] }));
  const m = path.join(root, 'estilos', 'k', 'modelo');
  fs.mkdirSync(m, { recursive: true });
  fs.writeFileSync(path.join(m, 'script.json'), JSON.stringify(SCRIPT));
  return root;
}
const fake = (dur) => async (cmd, args) => (cmd === 'ffprobe' ? { code: 0, out: String(dur) } : { code: 0, out: args.includes('check') ? 'CHECK OK' : '' });

test('kit válido passa, renderiza a 1ª plataforma da marca e não mexe na fila', async () => {
  const root = raiz();
  ESTILOS.__k = { motor: 'fs3d', modelo: 'estilos/k/modelo' };
  try {
    const dirTemp = path.join(root, 'tmp');
    const r = await testarKits(root, { run: fake(20), log: () => {}, dirTemp, estilos: ['__k'] });
    assert.deepEqual(r, [{ estilo: '__k', ok: true, plataforma: 'tiktok', segundos: 20 }]);
    assert.deepEqual(lerFila(root), []);
    assert.deepEqual(fs.readdirSync(dirTemp).filter((n) => n.startsWith('__k-')), []);
  } finally { delete ESTILOS.__k; }
});

test('pasta suja de execução anterior não é usada: cada execução monta em pasta própria', async () => {
  const root = raiz();
  ESTILOS.__k = { motor: 'fs3d', modelo: 'estilos/k/modelo' };
  try {
    const dirTemp = path.join(root, 'tmp');
    const velha = path.join(dirTemp, '__k-velha');
    fs.mkdirSync(path.join(velha, 'entrega'), { recursive: true });
    fs.writeFileSync(path.join(velha, 'entrega', 'tiktok.mp4'), 'antigo');
    fs.writeFileSync(path.join(velha, 'sobra.txt'), 'lixo');
    const cwds = [];
    const run = async (cmd, args, opts) => { cwds.push(opts?.cwd); return fake(20)(cmd, args); };
    const r = await testarKits(root, { run, log: () => {}, dirTemp, estilos: ['__k'] });
    assert.deepEqual(r, [{ estilo: '__k', ok: true, plataforma: 'tiktok', segundos: 20 }]);
    assert.ok(cwds.length > 0);
    assert.ok(cwds.every((c) => !String(c).startsWith(velha)), 'nenhum cwd pode ser a pasta velha');
  } finally { delete ESTILOS.__k; }
});

test('estilo desconhecido vira erro, sem TypeError', async () => {
  const root = raiz();
  const r = await testarKits(root, { run: fake(20), log: () => {}, dirTemp: path.join(root, 'tmp'), estilos: ['motio'] });
  assert.deepEqual(r, [{ estilo: 'motio', ok: false, erro: 'estilo desconhecido' }]);
});

test('estilo sem marca e estilo sem modelo falham com mensagem', async () => {
  const root = raiz();
  ESTILOS.__orfao = { motor: 'fs3d', modelo: 'estilos/k/modelo' };
  ESTILOS.__sem = { motor: 'fs3d', modelo: 'estilos/nao-existe/modelo' };
  try {
    const r = await testarKits(root, { run: fake(20), log: () => {}, dirTemp: path.join(root, 'tmp'), estilos: ['__orfao', '__sem'] });
    assert.equal(r[0].erro, 'nenhuma marca usa este estilo');
    assert.equal(r[1].erro, 'modelo ausente');
  } finally { delete ESTILOS.__orfao; delete ESTILOS.__sem; }
});

test('duração acima do limite falha', async () => {
  const root = raiz();
  ESTILOS.__k = { motor: 'fs3d', modelo: 'estilos/k/modelo' };
  try {
    const r = await testarKits(root, { run: fake(61), log: () => {}, dirTemp: path.join(root, 'tmp'), estilos: ['__k'] });
    assert.equal(r[0].ok, false);
    assert.match(r[0].erro, /61\.0 s/);
  } finally { delete ESTILOS.__k; }
});
