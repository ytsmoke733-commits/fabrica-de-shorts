import fs from 'node:fs';
import path from 'node:path';
import { estilo } from './estilos.mjs';
import { copiarProjeto } from './arquivos.mjs';

// Monta a pasta de um vídeo a partir do estilo: modelo + (kit) + (tema). Não mexe na fila.
export function montarVideo(root, estiloId, destDir) {
  const est = estilo(estiloId);
  const modelo = path.join(root, est.modelo);
  if (!fs.existsSync(modelo)) throw new Error(`modelo do estilo ${estiloId} não encontrado: ${est.modelo}`);
  let temaSrc = null;
  if (est.tema) {
    temaSrc = path.join(root, est.kit, '..', 'temas', `${est.tema}.json`);
    if (!fs.existsSync(temaSrc)) throw new Error(`tema não encontrado: ${est.tema} (${temaSrc})`);
  }
  copiarProjeto(modelo, destDir);
  if (est.kit) copiarProjeto(path.join(root, est.kit), path.join(destDir, 'kit'));
  if (temaSrc) fs.copyFileSync(temaSrc, path.join(destDir, 'tema.json'));
  return { motor: est.motor };
}
