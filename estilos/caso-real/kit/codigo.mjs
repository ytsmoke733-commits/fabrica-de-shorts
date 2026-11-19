// Código genérico para telas de computador. Só texto inofensivo, de vocabulário fixo.
// Nada de ferramentas reais, protocolos de ataque ou comandos de sistema.

// Tudo que nunca pode aparecer numa tela (os testes varrem VOCABULARIO e alertas).
export const TERMOS_PROIBIDOS = [
  /exploit/i, /payload/i, /shellcode/i, /reverse shell/i, /metasploit/i, /nmap/i, /sqlmap/i,
  /hydra/i, /mimikatz/i, /rm -rf/i, /drop table/i, /\/etc\/passwd/i, /<script/i, /eval\(/i,
  /base64 -d/i, /wget /i, /curl /i, /chmod \+x/i, /nc -e/i, /powershell -enc/i, /0x[0-9a-f]{8,}/i,
];

// Linhas prontas (a indentação já vem certa). Pseudo-código de verificação, carregamento, status, backup e fila.
export const VOCABULARIO = [
  'function verificar(usuario) {',
  '  if (senha.valida) return true;',
  '  return false;',
  '}',
  'function carregar(registros) {',
  '  const total = registros.length;',
  '  if (total > 0) return total;',
  '  return 0;',
  '}',
  'function status(servidor) {',
  '  const resposta = consultar(servidor);',
  '  if (resposta.ok) return "ativo";',
  '  return "parado";',
  '}',
  'function backup(arquivos) {',
  '  const fila = arquivos.length;',
  '  return fila;',
  '}',
  'const limite = 12;',
  'const tentativas = 3;',
  'const conexoes = 48;',
  'if (tentativas > limite) {',
  '  registrar("limite excedido");',
  '}',
  'carregando registros...',
  'carregando perfil do usuário...',
  'conectando ao servidor 03',
  'conectando ao servidor 17',
  'conexão 02 estabelecida',
  'conexão 09 encerrada',
  'status: OK',
  'status: aguardando',
  'status: verificando',
  'fila de backup: 12 arquivos',
  'fila de backup: 87 arquivos',
  'verificando senha... ok',
  'usuário 0042 autenticado',
  'lista de contas: 256 itens',
  'sincronizando pasta 05...',
  'relatório salvo',
];

// Gerador pseudo-aleatório com semente (mulberry32): mesmo seed, mesma sequência.
function mulberry32(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n linhas do vocabulário, determinísticas por semente.
export function linhasDeCodigo(seed, n) {
  const rnd = mulberry32(seed >>> 0);
  return Array.from({ length: n }, () => VOCABULARIO[Math.floor(rnd() * VOCABULARIO.length)]);
}

const ALERTAS = {
  bloqueado: ['SEUS ARQUIVOS FORAM BLOQUEADOS', 'acesso negado'],
  invasao: ['ACESSO NÃO AUTORIZADO', 'registro salvo'],
  ok: ['SISTEMA ATUALIZADO', 'tudo certo'],
};

// Textos fixos de alerta: [título, subtítulo]. Tipo desconhecido lança erro.
export function alertaGenerico(tipo) {
  if (!ALERTAS[tipo]) throw new RangeError(`tipo de alerta desconhecido: ${tipo}`);
  return [...ALERTAS[tipo]];
}
