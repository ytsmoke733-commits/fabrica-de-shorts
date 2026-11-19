import fs from 'node:fs';
import path from 'node:path';
import { LIMITE_S } from './paths.mjs';
import { carregarMarca, plataformasDaMarca } from './marca.mjs';
import { prontosParaRender, mudarEtapa } from './fila.mjs';
import { checarScript } from './checagem.mjs';
import { checarIsolamento } from './isolamento.mjs';
import { scriptPath } from './estilos.mjs';
import { renderizarVariante } from './render.mjs';
import { montarPostar, comandoCapa, comandoDuracao, comandoFolha } from './entrega.mjs';

export function lerVideo(root, item) {
  const dir = path.join(root, item.dir);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8'));
  const script = JSON.parse(fs.readFileSync(scriptPath(dir, meta.motor), 'utf8'));
  return { dir, meta, script, marca: carregarMarca(root, item.marca) };
}

export async function entregarVideo(root, item, { run, log = () => {}, so = null }) {
  const { dir, meta, script, marca } = lerVideo(root, item);
  const erros = [...checarScript(script, { marca, estilo: meta.estilo }), ...checarIsolamento(dir)];
  if (erros.length) throw new Error('checagem:\n- ' + erros.join('\n- '));
  const daMarca = plataformasDaMarca(marca);
  for (const p of so ?? []) {
    if (!daMarca.includes(p)) throw new Error(`plataforma "${p}" não pertence à marca ${marca.id} (use: ${daMarca.join(', ')})`);
  }
  const plats = daMarca.filter((p) => !so || so.includes(p));
  const arquivos = [];
  for (const p of plats) {
    log(`${item.id}: renderizando ${p}...`);
    const mp4 = await renderizarVariante(dir, meta.motor, p, run);
    const d = comandoDuracao(mp4);
    const s = parseFloat((await run(d.cmd, d.args, { cwd: dir })).out);
    if (!(s > 0)) throw new Error(`não consegui medir a duração de ${p}.mp4`);
    if (s > LIMITE_S[p] + 0.05) throw new Error(`${p}.mp4 tem ${s.toFixed(1)} s (limite ${LIMITE_S[p]} s)`);
    const folha = comandoFolha(mp4, path.join(dir, `folha-${p}.jpg`));
    const rf = await run(folha.cmd, folha.args, { cwd: dir });
    if (rf.code !== 0) throw new Error('folha falhou: ' + String(rf.out).trim().split(/\r?\n/).slice(-5).join(' | '));
    arquivos.push(`${p}.mp4 (${s.toFixed(1)} s)`);
  }
  const ent = path.join(dir, 'entrega');
  fs.mkdirSync(ent, { recursive: true });
  const jpg = path.join(ent, 'capa.jpg');
  const capa = comandoCapa(path.join(ent, `${plats[0]}.mp4`), jpg, script.capa_t ?? 1.0);
  const rc = await run(capa.cmd, capa.args, { cwd: dir });
  if (rc.code !== 0) throw new Error('capa falhou: ' + String(rc.out).trim().split(/\r?\n/).slice(-5).join(' | '));
  if (!fs.existsSync(jpg)) throw new Error('capa não foi gerada');
  fs.writeFileSync(path.join(ent, 'postar.md'), montarPostar(script, marca));
  return arquivos;
}

export async function rodarLote(root, { run, log = console.log }) {
  const resumo = [];
  for (const item of prontosParaRender(root)) {
    try {
      const arquivos = await entregarVideo(root, item, { run, log });
      mudarEtapa(root, item.id, 'entregue');
      resumo.push({ id: item.id, ok: true, arquivos });
      log(`${item.id}: OK (${arquivos.join(', ')})`);
    } catch (e) {
      mudarEtapa(root, item.id, 'render', e.message);
      resumo.push({ id: item.id, ok: false, erro: e.message });
      log(`${item.id}: FALHOU\n${e.message}`);
    }
  }
  return resumo;
}
