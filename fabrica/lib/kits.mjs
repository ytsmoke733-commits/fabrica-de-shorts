import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ESTILOS, estilosComKit, scriptPath } from './estilos.mjs';
import { montarVideo } from './montar.mjs';
import { carregarMarca, plataformasDaMarca } from './marca.mjs';
import { checarScript, limiteDe } from './checagem.mjs';
import { checarIsolamento } from './isolamento.mjs';
import { renderizarVariante } from './render.mjs';
import { comandoDuracao } from './entrega.mjs';

// No Windows o render pode segurar arquivos por um instante após sair; tenta de novo e nunca derruba o teste por causa da limpeza
function limpar(dir, log) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch (e) {
    log(`aviso: não consegui apagar ${dir}: ${e.message}`);
  }
}

function marcaDoEstilo(root, estiloId) {
  const dir = path.join(root, 'marcas');
  if (!fs.existsSync(dir)) return null;
  for (const id of fs.readdirSync(dir)) {
    if (!fs.existsSync(path.join(dir, id, 'marca.json'))) continue;
    const m = carregarMarca(root, id);
    if (m.estilos.includes(estiloId)) return m;
  }
  return null;
}

export async function testarKits(root, { run, log = console.log, dirTemp = path.join(os.tmpdir(), 'fabrica-kits'), estilos = estilosComKit() }) {
  const resultado = [];
  for (const estiloId of estilos) {
    const est = ESTILOS[estiloId];
    if (!est) { resultado.push({ estilo: estiloId, ok: false, erro: 'estilo desconhecido' }); continue; }
    if (!fs.existsSync(path.join(root, est.modelo))) { resultado.push({ estilo: estiloId, ok: false, erro: 'modelo ausente' }); continue; }
    const marca = marcaDoEstilo(root, estiloId);
    if (!marca) { resultado.push({ estilo: estiloId, ok: false, erro: 'nenhuma marca usa este estilo' }); continue; }
    let dir;
    try {
      fs.mkdirSync(dirTemp, { recursive: true });
      dir = fs.mkdtempSync(path.join(dirTemp, estiloId + '-'));
      log(`${estiloId}: montando...`);
      const { motor } = montarVideo(root, estiloId, dir);
      const script = JSON.parse(fs.readFileSync(scriptPath(dir, motor), 'utf8'));
      const erros = [...checarScript(script, { marca, estilo: estiloId }), ...checarIsolamento(dir)];
      if (erros.length) throw new Error('checagem:\n- ' + erros.join('\n- '));
      const p = plataformasDaMarca(marca)[0];
      log(`${estiloId}: renderizando ${p}...`);
      const mp4 = await renderizarVariante(dir, motor, p, run);
      const d = comandoDuracao(mp4);
      const s = parseFloat((await run(d.cmd, d.args, { cwd: dir })).out);
      if (!(s > 0)) throw new Error(`não consegui medir a duração de ${p}.mp4`);
      const lim = limiteDe(script, p);
    if (s > lim + 0.05) throw new Error(`${p}.mp4 tem ${s.toFixed(1)} s (limite ${lim} s)`);
      resultado.push({ estilo: estiloId, ok: true, plataforma: p, segundos: s });
      log(`${estiloId}: OK (${p} ${s.toFixed(1)} s)`);
    } catch (e) {
      resultado.push({ estilo: estiloId, ok: false, erro: e.message });
      log(`${estiloId}: FALHOU\n${e.message}`);
    } finally {
      if (dir) limpar(dir, log);
    }
  }
  return resultado;
}
