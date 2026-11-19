import fs from 'node:fs';
import path from 'node:path';

const OBRIGATORIOS = ['id', 'nome', 'nicho', 'perfis', 'estilos', 'voz', 'proibido'];

export function validarMarca(m) {
  const erros = [];
  for (const k of OBRIGATORIOS) if (m[k] === undefined) erros.push(`campo obrigatório ausente: ${k}`);
  if (m.estilos !== undefined && (!Array.isArray(m.estilos) || m.estilos.length === 0)) erros.push('estilos deve ser uma lista não vazia');
  if (m.perfis !== undefined && (m.perfis === null || typeof m.perfis !== 'object' || Array.isArray(m.perfis))) erros.push('perfis deve ser um objeto');
  if (m.proibido !== undefined && !Array.isArray(m.proibido)) erros.push('proibido deve ser uma lista');
  return erros;
}

export function carregarMarca(root, id) {
  const f = path.join(root, 'marcas', id, 'marca.json');
  if (!fs.existsSync(f)) throw new Error(`marca não encontrada: ${id}`);
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  const erros = validarMarca(m);
  if (erros.length) throw new Error(`marca ${id} inválida: ${erros.join('; ')}`);
  return m;
}

export function plataformasDaMarca(marca) {
  const p = [];
  if (marca.perfis.tiktok) p.push('tiktok');
  if (marca.perfis.instagram) p.push('reels');
  if (marca.perfis.youtube) p.push('shorts');
  return p;
}
