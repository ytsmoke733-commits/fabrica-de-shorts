import fs from 'node:fs';
import path from 'node:path';
import { PY, SCRIPTS } from './paths.mjs';
import { copiarProjeto } from './arquivos.mjs';
import { scriptPath } from './estilos.mjs';
import { narracaoDaVariante, comandoNarracao, temposDoScript, ajustarInicio } from './narracao.mjs';

export function prepararVariante(dir, motor, plataforma) {
  const work = path.join(dir, '.variantes', plataforma);
  fs.rmSync(work, { recursive: true, force: true });
  copiarProjeto(dir, work);
  const sp = scriptPath(work, motor);
  const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
  const i = s.lines.length - 1, ult = s.lines[i], v = ult.variantes?.[plataforma];
  if (!v) throw new Error(`a última linha não tem variante "${plataforma}"`);
  const { variantes, ...base } = ult;
  const { caps: _herdado, ...semCaps } = base; // sem caps na variante, o motor divide a legenda sozinho
  s.lines[i] = { ...semCaps, text: v.text, ...(v.caps ? { caps: v.caps } : {}) };
  fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
  return work;
}

// nar (opcional): { corpo, cta, lead, gap, outro } → usa a narração própria em vez de voice.py
export function passos(motor, work, saida, nar = null) {
  const py = (cwd, script, ...a) => ({ cmd: PY, args: [script, ...a], cwd });
  const vozDe = (cwd) => {
    if (!nar) return [py(cwd, path.join(SCRIPTS, 'voice.py'), '.'), py(cwd, path.join(SCRIPTS, 'words.py'), '.')];
    const wav = path.join('data', 'narracao-propria.wav');
    const c = comandoNarracao(nar, wav, nar);
    return [{ mkdir: path.join(cwd, 'data') }, { ...c, cwd }, py(cwd, path.join(SCRIPTS, 'words.py'), '.', '--audio', wav), { ajustar: cwd, lead: nar.lead }];
  };
  if (motor === 'fs3d') return [
    ...vozDe(work),
    ...(fs.existsSync(path.join(work, 'tools', 'env.py')) ? [py(work, 'tools/env.py', '.')] : []),
    { cmd: 'node', args: ['tools/capture.mjs', 'check'], cwd: work, espera: 'CHECK OK' },
    { cmd: 'node', args: ['tools/capture.mjs', 'cues'], cwd: work },
    py(work, 'tools/mix.py', '.'),
    { cmd: 'node', args: ['tools/capture.mjs', 'video', saida], cwd: work },
  ];
  if (motor === 'hyperframes') {
    const voz = path.join(work, 'voz');
    return [
      ...vozDe(voz),
      { cmd: 'node', args: ['gen.mjs'], cwd: work },
      py(voz, 'tools/mix.py', '.'),
      { copiar: [path.join(voz, 'data', 'mix.wav'), path.join(work, 'video', 'assets', 'mix.wav')] },
      { cmd: 'hyperframes', args: ['render', '--quality', 'delivery', '--fps', '30', '-o', saida], cwd: path.join(work, 'video') },
    ];
  }
  throw new Error(`motor desconhecido: ${motor}`);
}

export async function renderizarVariante(dir, motor, plataforma, run) {
  const work = prepararVariante(dir, motor, plataforma);
  const saida = path.join(dir, 'entrega', `${plataforma}.mp4`);
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const nar = narracaoDaVariante(dir, plataforma);
  const tempos = nar && temposDoScript(JSON.parse(fs.readFileSync(scriptPath(work, motor), 'utf8')));
  for (const p of passos(motor, work, saida, nar && { ...nar, ...tempos })) {
    if (p.mkdir) { fs.mkdirSync(p.mkdir, { recursive: true }); continue; }
    if (p.ajustar) { ajustarInicio(p.ajustar, p.lead); continue; }
    if (p.copiar) { fs.mkdirSync(path.dirname(p.copiar[1]), { recursive: true }); fs.copyFileSync(p.copiar[0], p.copiar[1]); continue; }
    const { code, out } = await run(p.cmd, p.args, { cwd: p.cwd });
    if (code !== 0) throw new Error(`falhou: ${path.basename(p.cmd)} ${p.args.join(' ')}\n${String(out).slice(-1500)}`);
    if (p.espera && !String(out).includes(p.espera)) throw new Error(`esperava "${p.espera}" em: ${p.args.join(' ')}\n${String(out).slice(-1500)}`);
  }
  return saida;
}
