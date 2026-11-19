import fs from 'node:fs';
import path from 'node:path';
import { carregarMarca } from './marca.mjs';
import { estilo, scriptPath } from './estilos.mjs';
import { montarVideo } from './montar.mjs';
import { adicionar } from './fila.mjs';

export function novoVideo(root, { marca: marcaId, estilo: estiloId, slug, data = new Date() }) {
  const marca = carregarMarca(root, marcaId);
  if (!marca.estilos.includes(estiloId)) throw new Error(`estilo "${estiloId}" não é permitido na marca ${marcaId} (permitidos: ${marca.estilos.join(', ')})`);
  if (!/^[a-z0-9-]+$/.test(slug || '')) throw new Error('slug deve ter só letras minúsculas, números e hífens');
  const est = estilo(estiloId);
  const id = `${dataLocal(data)}-${slug}`;
  const dir = path.join(root, 'marcas', marcaId, 'videos', id);
  if (fs.existsSync(dir)) throw new Error(`já existe: ${dir}`);

  try {
    montarVideo(root, estiloId, dir);
    const sp = scriptPath(dir, est.motor);
    const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    // mantém as linhas do modelo como exemplo de formato; o roteirista reescreve tudo
    Object.assign(s, { title: '', lang: 'pt', voice: marca.voz, marca_nome: marca.nome, ...(marca.arroba ? { marca_arroba: marca.arroba } : {}), gancho: '', sources: [], postar: { titulo: '', descricao: '', hashtags: [] } });
    fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ id, marca: marcaId, estilo: estiloId, motor: est.motor }, null, 1) + '\n');
    adicionar(root, { id, marca: marcaId, estilo: estiloId, dir: path.relative(root, dir) });
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw err;
  }
  return { id, dir };
}

// AAAA-MM-DD pela data local (não UTC): um vídeo feito à noite no Brasil não pode cair no dia seguinte
function dataLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
