import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { narracaoDaVariante, comandoNarracao, temposDoScript, importarNarracoes, ajustarInicio } from '../lib/narracao.mjs';
import { passos } from '../lib/render.mjs';
import { adicionar, lerFila } from '../lib/fila.mjs';

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const nomes = (ps) => ps.map((p) => (p.mkdir ? 'mkdir' : p.copiar ? 'copiar' : p.ajustar ? 'ajustar' : p.cmd === 'ffmpeg' ? 'ffmpeg' : p.args?.[0]?.split(/[\\/]/).pop()));

function comNarracao(arquivos) {
  const dir = tmp('fab-n-');
  fs.mkdirSync(path.join(dir, 'narracao'));
  for (const a of arquivos) fs.writeFileSync(path.join(dir, 'narracao', a), 'x');
  return dir;
}

test('sem pasta narracao/ o vídeo usa a voz gerada', () => {
  assert.equal(narracaoDaVariante(tmp('fab-n-'), 'tiktok'), null);
});

test('tiktok e reels usam cta-segue; shorts usa cta-inscreve', () => {
  const dir = comNarracao(['corpo.mp3', 'cta-segue.mp3', 'cta-inscreve.wav']);
  assert.deepEqual(narracaoDaVariante(dir, 'tiktok'), { corpo: path.join(dir, 'narracao', 'corpo.mp3'), cta: path.join(dir, 'narracao', 'cta-segue.mp3') });
  assert.equal(narracaoDaVariante(dir, 'reels').cta, path.join(dir, 'narracao', 'cta-segue.mp3'));
  assert.equal(narracaoDaVariante(dir, 'shorts').cta, path.join(dir, 'narracao', 'cta-inscreve.wav'));
});

test('narracao/ sem a chamada da plataforma dá erro claro', () => {
  const dir = comNarracao(['corpo.mp3', 'cta-segue.mp3']);
  assert.throws(() => narracaoDaVariante(dir, 'shorts'), /cta-inscreve/);
});

test('temposDoScript usa lead, outro e o gap da penúltima linha, com padrões', () => {
  assert.deepEqual(temposDoScript({ lead: 0.3, outro: 1, gap: 0.2, lines: [{}, { gap: 0.5 }, {}] }), { lead: 0.3, gap: 0.5, outro: 1 });
  assert.deepEqual(temposDoScript({ lines: [{}, {}] }), { lead: 0.45, gap: 0.32, outro: 0.9 });
});

test('passos com narração própria trocam voice.py por ffmpeg + words.py --audio', () => {
  const nar = { corpo: 'C.mp3', cta: 'T.mp3', lead: 0.4, gap: 0.3, outro: 0.9 };
  const w = tmp('fab-n-');
  const f = passos('fs3d', w, 'OUT.mp4', nar);
  assert.deepEqual(nomes(f).slice(0, 3), ['mkdir', 'ffmpeg', 'words.py']);
  assert.ok(!nomes(f).includes('voice.py'));
  assert.deepEqual(f[2].args.slice(1), ['.', '--audio', path.join('data', 'narracao-propria.wav')]);
  const h = passos('hyperframes', w, 'OUT.mp4', nar);
  assert.deepEqual(nomes(h).slice(0, 3), ['mkdir', 'ffmpeg', 'words.py']);
  assert.equal(h[1].cwd, path.join(w, 'voz'));
});

test('comandoNarracao junta corpo e chamada com silêncios e corta sobras (ffmpeg real)', () => {
  const d = tmp('fab-n-');
  const tom = (nome, s) => {
    const f = path.join(d, nome);
    // 0,5 s de silêncio + tom + 0,5 s de silêncio: a sobra deve ser cortada
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=0.5`, '-f', 'lavfi', '-i', `sine=f=440:d=${s}:r=44100`,
      '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=0.5`, '-filter_complex', '[1:a]aformat=channel_layouts=stereo[t];[0:a][t][2:a]concat=n=3:v=0:a=1', f]);
    return f;
  };
  const saida = path.join(d, 'out.wav');
  const c = comandoNarracao({ corpo: tom('c.wav', 2), cta: tom('t.wav', 1) }, saida, { lead: 0.4, gap: 0.3, outro: 0.9 });
  execFileSync(c.cmd, c.args);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', saida]).toString());
  assert.ok(Math.abs(dur - (0.4 + 2 + 0.3 + 1 + 0.9)) < 0.15, `duração ${dur}`);
  const info = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate,channels', '-of', 'csv=p=0', saida]).toString().trim();
  assert.equal(info, '24000,1');
});

function raiz() {
  const root = tmp('fab-ni-');
  for (const slug of ['lua', 'sol']) {
    const rel = path.join('marcas', 'conhecimento', 'videos', `2026-11-16-${slug}`);
    fs.mkdirSync(path.join(root, rel), { recursive: true });
    adicionar(root, { id: `conhecimento-2026-11-16-${slug}`, marca: 'conhecimento', estilo: 'voxel', dir: rel });
  }
  const pasta = path.join(root, 'in');
  fs.mkdirSync(pasta);
  return { root, pasta };
}

test('importarNarracoes copia corpo e chamadas para o vídeo e manda para render', () => {
  const { root, pasta } = raiz();
  for (const a of ['lua.mp3', 'cta-segue.mp3', 'cta-inscreve.mp3']) fs.writeFileSync(path.join(pasta, a), a);
  const r = importarNarracoes(root, pasta);
  assert.deepEqual(r.importados, ['conhecimento-2026-11-16-lua']);
  assert.deepEqual(r.semAudio, ['conhecimento-2026-11-16-sol']);
  const n = path.join(root, 'marcas', 'conhecimento', 'videos', '2026-11-16-lua', 'narracao');
  assert.equal(fs.readFileSync(path.join(n, 'corpo.mp3'), 'utf8'), 'lua.mp3');
  assert.ok(fs.existsSync(path.join(n, 'cta-segue.mp3')) && fs.existsSync(path.join(n, 'cta-inscreve.mp3')));
  const fila = lerFila(root);
  assert.equal(fila.find((v) => v.id.endsWith('lua')).etapa, 'render');
  assert.equal(fila.find((v) => v.id.endsWith('sol')).etapa, 'roteiro');
});

test('importarNarracoes troca um corpo antigo de outra extensão', () => {
  const { root, pasta } = raiz();
  const n = path.join(root, 'marcas', 'conhecimento', 'videos', '2026-11-16-lua', 'narracao');
  fs.mkdirSync(n); fs.writeFileSync(path.join(n, 'corpo.wav'), 'velho');
  for (const a of ['lua.mp3', 'cta-segue.mp3', 'cta-inscreve.mp3']) fs.writeFileSync(path.join(pasta, a), a);
  importarNarracoes(root, pasta);
  assert.deepEqual(fs.readdirSync(n).sort(), ['corpo.mp3', 'cta-inscreve.mp3', 'cta-segue.mp3']);
});

test('importarNarracoes sem as chamadas finais não mexe em nada', () => {
  const { root, pasta } = raiz();
  fs.writeFileSync(path.join(pasta, 'lua.mp3'), 'x');
  assert.throws(() => importarNarracoes(root, pasta), /cta-segue/);
  assert.equal(lerFila(root).find((v) => v.id.endsWith('lua')).etapa, 'roteiro');
});

test('renderizarVariante usa narracao/ do vídeo: cria data/ e passa a chamada certa', async () => {
  const { renderizarVariante } = await import('../lib/render.mjs');
  const dir = comNarracao(['corpo.mp3', 'cta-segue.mp3', 'cta-inscreve.mp3']);
  fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify({ lead: 0.3, lines: [{ text: 'a', gap: 0.4 }, { text: 'b', variantes: { shorts: { text: 'se inscreve' } } }] }));
  const chamadas = [];
  const run = async (cmd, args, { cwd }) => {
    chamadas.push({ cmd, args, cwd });
    if (args.includes('--audio')) { // o words.py de mentira grava os JSON que o ajuste lê
      fs.writeFileSync(path.join(cwd, 'data', 'words.json'), '[]');
      fs.writeFileSync(path.join(cwd, 'data', 'lines.json'), JSON.stringify({ duration: 1, lines: [] }));
    }
    return { code: 0, out: 'CHECK OK' };
  };
  await renderizarVariante(dir, 'fs3d', 'shorts', run);
  const ff = chamadas[0];
  assert.equal(ff.cmd, 'ffmpeg');
  assert.ok(ff.args.includes(path.join(dir, 'narracao', 'cta-inscreve.mp3')));
  assert.ok(ff.args.some((a) => a.includes('atrim=duration=0.4[s1]')) && ff.args.some((a) => a.includes('atrim=duration=0.3[s0]')));
  assert.ok(fs.existsSync(path.join(dir, '.variantes', 'shorts', 'data')));
  assert.ok(chamadas[1].args.includes('--audio'));
});

test('passos: o ajuste de início vem logo depois do words.py, só com narração própria', () => {
  const nar = { corpo: 'C.mp3', cta: 'T.mp3', lead: 0.4, gap: 0.3, outro: 0.9 };
  const w = tmp('fab-n-');
  const f = passos('fs3d', w, 'OUT.mp4', nar);
  assert.deepEqual(nomes(f).slice(0, 4), ['mkdir', 'ffmpeg', 'words.py', 'ajustar']);
  assert.deepEqual(f[3], { ajustar: w, lead: 0.4 });
  const h = passos('hyperframes', w, 'OUT.mp4', nar);
  assert.deepEqual(nomes(h).slice(0, 4), ['mkdir', 'ffmpeg', 'words.py', 'ajustar']);
  assert.deepEqual(h[3], { ajustar: path.join(w, 'voz'), lead: 0.4 });
  for (const m of ['fs3d', 'hyperframes']) assert.ok(!nomes(passos(m, w, 'OUT.mp4')).includes('ajustar'));
});

test('ajustarInicio move só as palavras antes do lead e a 1ª linha', () => {
  const d = tmp('fab-n-');
  fs.mkdirSync(path.join(d, 'data'));
  const words = [{ w: 'a', line: 0, s: 0.04, e: 0.2 }, { w: 'b', line: 0, s: 0.1, e: 0.12 }, { w: 'c', line: 0, s: 0.45, e: 0.7 }, { w: 'd', line: 1, s: 1.2, e: 1.5 }];
  const lines = { duration: 3, lines: [{ i: 0, text: 'a b c', start: 0.04, end: 0.7 }, { i: 1, text: 'd', start: 1.2, end: 1.5 }] };
  fs.writeFileSync(path.join(d, 'data', 'words.json'), JSON.stringify(words));
  fs.writeFileSync(path.join(d, 'data', 'lines.json'), JSON.stringify(lines));
  ajustarInicio(d, 0.45);
  const w = JSON.parse(fs.readFileSync(path.join(d, 'data', 'words.json'), 'utf8'));
  const l = JSON.parse(fs.readFileSync(path.join(d, 'data', 'lines.json'), 'utf8'));
  assert.deepEqual(w[0], { w: 'a', line: 0, s: 0.45, e: 0.5 });
  assert.deepEqual(w[1], { w: 'b', line: 0, s: 0.45, e: 0.5 });
  assert.deepEqual(w.slice(2), words.slice(2));
  assert.equal(l.lines[0].start, 0.45);
  assert.deepEqual(l.lines[1], lines.lines[1]);
  assert.equal(l.duration, 3);
  assert.equal(l.lines[0].end, 0.7);
});

test('renderizarVariante com narracao/ ajusta o início depois do words.py', async () => {
  const { renderizarVariante } = await import('../lib/render.mjs');
  const dir = comNarracao(['corpo.mp3', 'cta-segue.mp3', 'cta-inscreve.mp3']);
  fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify({ lead: 0.5, lines: [{ text: 'a' }, { text: 'b', variantes: { shorts: { text: 'se inscreve' } } }] }));
  const data = path.join(dir, '.variantes', 'shorts', 'data');
  const run = async (cmd, args) => {
    if (args.includes('--audio')) { // o words.py de mentira grava o que o Whisper gravaria
      fs.writeFileSync(path.join(data, 'words.json'), JSON.stringify([{ w: 'a', line: 0, s: 0.04, e: 0.3 }]));
      fs.writeFileSync(path.join(data, 'lines.json'), JSON.stringify({ duration: 2, lines: [{ i: 0, text: 'a', start: 0.04, end: 0.3 }] }));
    }
    return { code: 0, out: 'CHECK OK' };
  };
  await renderizarVariante(dir, 'fs3d', 'shorts', run);
  assert.equal(JSON.parse(fs.readFileSync(path.join(data, 'words.json'), 'utf8'))[0].s, 0.5);
  assert.equal(JSON.parse(fs.readFileSync(path.join(data, 'lines.json'), 'utf8')).lines[0].start, 0.5);
});
