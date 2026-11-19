import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = process.env.FABRICA_ROOT || path.resolve(HERE, '..', '..');
export const SKILL = path.join(os.homedir(), '.claude', 'skills', 'faceless-shorts');
export const SCRIPTS = path.join(SKILL, 'scripts');
export const PY = process.platform === 'win32'
  ? path.join(os.homedir(), '.faceless-shorts', 'venv', 'Scripts', 'python.exe')
  : path.join(os.homedir(), '.faceless-shorts', 'venv', 'bin', 'python');
export const PLATAFORMAS = ['tiktok', 'reels', 'shorts'];
export const LIMITE_S = { tiktok: 60, reels: 45, shorts: 45 };
