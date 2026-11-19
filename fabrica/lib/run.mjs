import { spawn } from 'node:child_process';

// shell no Windows para achar .cmd globais (hyperframes); os caminhos do projeto não têm espaços
export function run(cmd, args, { cwd }) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, shell: process.platform === 'win32', env: { ...process.env, PYTHONUTF8: '1' } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('error', (e) => resolve({ code: -1, out: out + String(e) }));
    p.on('close', (code) => resolve({ code, out }));
  });
}
