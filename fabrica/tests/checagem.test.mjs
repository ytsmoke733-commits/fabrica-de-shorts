import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checarCaps, checarCapsTexto, estimarSegundos, checarScript } from '../lib/checagem.mjs';
import { ESTILOS } from '../lib/estilos.mjs';

const MARCA_A = { id: 'conhecimento', estilos: ['deep-dive', 'motion'], perfis: { tiktok: 'p', youtube: 'p' }, proibido: [] };
const MARCA_B = { id: 'hacker', estilos: ['motion-b'], perfis: { tiktok: 'p', instagram: 'p', youtube: 'p' }, proibido: ['baix(e|ar|a) (o |um )?(cheat|hack|crack)'] };

const roteiro = (extra = {}) => ({
  lang: 'pt', gancho: 'Engolir chiclete fica 7 anos?', sources: ['Mayo Clinic'], lead: 0.35, outro: 1.0, gap: 0.26,
  postar: { titulo: 't', descricao: 'd', hashtags: ['a'] },
  lines: [
    { text: 'O que acontece se você engolir chiclete?', caps: 'O que *acontece | se você *engolir | *chiclete?' },
    { text: 'Ele desce até o estômago.', caps: 'Ele *desce | até o *estômago' },
    { text: 'Segue pra saber mais.', caps: 'Segue *pra |saber *mais', variantes: {
      tiktok: { text: 'Segue pra parte dois.', caps: 'Segue *pra |parte *2' },
      reels: { text: 'Segue pra parte dois.', caps: 'Segue *pra |parte *2' },
      shorts: { text: 'Se inscreve pra parte dois.', caps: 'Se *inscreve | pra parte *2' } } },
  ],
  ...extra,
});

test('checarCaps aceita blocos de 1 a 3 palavras com 1 destaque', () => {
  assert.deepEqual(checarCaps('O que *acontece | *chiclete?'), []);
});

test('checarCaps acusa bloco longo e destaque errado', () => {
  const erros = checarCaps('um dois tres *quatro | sem destaque | *a *b');
  assert.equal(erros.filter((e) => e.includes('palavras (use 1 a 3)')).length, 1);
  assert.equal(erros.filter((e) => e.includes('em destaque')).length, 2);
});

test('checarCaps recusa número por extenso (a tela usa algarismos)', () => {
  const erros = checarCaps('Umas cem *mil | mais de *trinta');
  assert.equal(erros.filter((e) => e.includes('por extenso')).length, 3);
  assert.ok(erros.some((e) => e.includes('"cem"')));
});

test('checarCaps aceita algarismos com escala e "um" artigo', () => {
  assert.deepEqual(checarCaps('Umas 100 *mil | de *36 milhões | tirou *um dia'), []);
});

test('roteiro completo da marca A passa', () => {
  assert.deepEqual(checarScript(roteiro(), { marca: MARCA_A, estilo: 'deep-dive' }), []);
});

test('marca A não exige variante reels', () => {
  const r = roteiro();
  delete r.lines[2].variantes.reels;
  assert.deepEqual(checarScript(r, { marca: MARCA_A, estilo: 'deep-dive' }), []);
});

test('marca B exige reels e bloqueia estilo de outra marca', () => {
  const r = roteiro();
  delete r.lines[2].variantes.reels;
  const erros = checarScript(r, { marca: MARCA_B, estilo: 'deep-dive' });
  assert.ok(erros.some((e) => e.includes('variante "reels"')));
  assert.ok(erros.some((e) => e.includes('não é permitido na marca hacker')));
});

test('faltando gancho, fontes e postar', () => {
  const erros = checarScript(roteiro({ gancho: '', sources: [], postar: undefined }), { marca: MARCA_A, estilo: 'motion' });
  assert.ok(erros.some((e) => e.includes('gancho')));
  assert.ok(erros.some((e) => e.includes('sources')));
  assert.ok(erros.some((e) => e.includes('postar')));
});

test('conteúdo proibido da marca B é acusado', () => {
  const r = roteiro();
  r.lines[1].text = 'Aí ele mandou baixar o cheat no site.';
  const erros = checarScript(r, { marca: { ...MARCA_B, estilos: ['deep-dive'] }, estilo: 'deep-dive' });
  assert.ok(erros.some((e) => e.includes('conteúdo proibido')));
});

test('conteúdo proibido em postar (título) também é acusado', () => {
  const r = roteiro({ postar: { titulo: 'Como baixar o cheat', descricao: 'd', hashtags: ['a'] } });
  const erros = checarScript(r, { marca: { ...MARCA_B, estilos: ['deep-dive'] }, estilo: 'deep-dive' });
  assert.ok(erros.some((e) => e.includes('conteúdo proibido')));
});

test('regex inválida em proibido vira erro, sem lançar', () => {
  const marca = { ...MARCA_A, proibido: ['('] };
  const erros = checarScript(roteiro(), { marca, estilo: 'deep-dive' });
  assert.ok(erros.includes('regex inválida em proibido da marca conhecimento: ('));
});

test('estimativa de duração e limite de 45 s no shorts', () => {
  const s = estimarSegundos(roteiro(), 'shorts');
  assert.ok(s > 3 && s < 15, `estimativa ${s}`);
  const longo = roteiro();
  longo.lines[1].text = Array(140).fill('palavra').join(' ');
  longo.lines[1].caps = '*palavra';
  const erros = checarScript(longo, { marca: MARCA_A, estilo: 'motion' });
  assert.ok(erros.some((e) => e.includes('shorts: duração estimada')));
  assert.ok(!erros.some((e) => e.includes('tiktok: duração estimada')));
});

test('chamada final: shorts precisa pedir inscrição; tiktok/reels precisam pedir para seguir', () => {
  const r = roteiro();
  r.lines[2].variantes.shorts.text = 'Segue pra parte dois.';
  r.lines[2].variantes.tiktok.text = 'Se inscreve pra parte dois.';
  r.lines[2].variantes.reels.text = 'Veja a parte dois.';
  const erros = checarScript(r, { marca: MARCA_B, estilo: 'motion-b' });
  assert.ok(erros.includes('variante shorts: a chamada final precisa pedir para se inscrever'));
  assert.ok(erros.includes('variante tiktok: a chamada final precisa pedir para seguir'));
  assert.ok(erros.includes('variante reels: a chamada final precisa pedir para seguir'));
});

test('chamada final: tiktok/reels com "inscrev" além de "segue" é recusado', () => {
  const r = roteiro();
  r.lines[2].variantes.tiktok.text = 'Segue e se inscreve.';
  const erros = checarScript(r, { marca: MARCA_A, estilo: 'deep-dive' });
  assert.ok(erros.includes('variante tiktok: a chamada final precisa pedir para seguir'));
});

test('checarCaps aceita escala no plural sem número e recusa "mil" sozinho', () => {
  assert.deepEqual(checarCaps('testa *milhões | de *senhas'), []);
  assert.equal(checarCaps('*mil vezes').filter((e) => e.includes('por extenso')).length, 1);
});

test('checarCapsTexto: igual ao texto, com algarismo cobrindo o número falado', () => {
  assert.deepEqual(checarCapsTexto('Umas *100 mil | *vezes', 'Umas cem mil vezes.'), []);
  assert.deepEqual(checarCapsTexto('Isso *dá mais | de *36 milhões | por *ano', 'Isso dá mais de trinta e seis milhões por ano.'), []);
  assert.deepEqual(checarCapsTexto('*Fica | *7 anos', 'Fica sete anos.'), []);
  assert.deepEqual(checarCapsTexto('em *2 etapas', 'em duas etapas.'), []);
});

test('checarCapsTexto: palavra faltando, sobrando ou trocada é erro', () => {
  assert.equal(checarCapsTexto('Se *inscreve | parte *2', 'Se inscreve pra parte dois.').length, 1);
  assert.equal(checarCapsTexto('Segue *pra', 'Segue pra mais.').length, 1);
  assert.equal(checarCapsTexto('*Outra | coisa', 'Segue pra').length, 1);
});

test('checarScript acusa caps de variante diferentes do texto', () => {
  const r = roteiro();
  r.lines[2].variantes.shorts.caps = 'Se *inscreve | *agora';
  assert.ok(checarScript(r, { marca: MARCA_A, estilo: 'motion' }).some((e) => e.startsWith('variante shorts:') && e.includes('não batem')));
});

test('checarCapsTexto: "e" entre dois números separados não vira um número só', () => {
  assert.deepEqual(checarCapsTexto('entre *2 | e *3 meses', 'entre dois e três meses.'), []);
  assert.equal(checarCapsTexto('*20 | e *3', 'vinte e três').length, 1);
  assert.deepEqual(checarCapsTexto('*23', 'vinte e três'), []);
  assert.deepEqual(checarCapsTexto('de *36 milhões', 'de trinta e seis milhões'), []);
});

test('checarCapsTexto: "*50%" cobre "por cento" falado', () => {
  assert.deepEqual(checarCapsTexto('*50% | dos *casos', 'cinquenta por cento dos casos.'), []);
  assert.equal(checarCapsTexto('*50% | dos *casos', 'cinquenta dos casos.').length, 1);
});

test('checarCapsTexto: aceita o mesmo que o kit (pontuação encerra o número, "um" artigo, "e" só de ordem menor)', () => {
  assert.deepEqual(checarCapsTexto('*3, | *2, | *1.', 'Três, dois, um.'), []);
  assert.deepEqual(checarCapsTexto('Conta *1 | *2 | *3', 'Conta um dois três.'), []);
  assert.deepEqual(checarCapsTexto('*10, | *11 e | *12', 'Dez, onze e doze.'), []);
  assert.deepEqual(checarCapsTexto('Às *10 | uma *pessoa | *ligou', 'Às dez uma pessoa ligou.'), []);
});

test('checarCapsTexto: valor do algarismo diferente do falado é erro', () => {
  assert.equal(checarCapsTexto('*8 anos', 'sete anos').length, 1);
  assert.equal(checarCapsTexto('*36 milhões', 'trinta e seis mil').length, 1);
  assert.equal(checarCapsTexto('*50 | dos casos', 'cinquenta por cento dos casos').length, 1);
});

test('checarScript: caps diferentes do texto só são recusadas em estilo com kit', () => {
  const r = roteiro();
  r.lines[1].caps = 'Ele *sobe | até o *cérebro';
  // hoje todo estilo registrado tem kit: um estilo de teste sem kit mostra a regra
  ESTILOS.__semKit = { motor: 'fs3d', modelo: 'x' };
  try {
    const marca = { ...MARCA_A, estilos: ['__semKit', 'motion', 'deep-dive'] };
    assert.deepEqual(checarScript(r, { marca, estilo: '__semKit' }).filter((e) => e.includes('caps')), []);
    assert.ok(checarScript(r, { marca, estilo: 'motion' }).some((e) => e.includes('não batem com o texto')));
    assert.ok(checarScript(r, { marca, estilo: 'deep-dive' }).some((e) => e.includes('não batem com o texto')));
  } finally { delete ESTILOS.__semKit; }
});

test('limite_s no roteiro estende o limite até 60 s, nunca além', () => {
  const longo = roteiro();
  longo.lines[1].text = Array(140).fill('palavra').join(' ');
  longo.lines[1].caps = '*palavra';
  const s = estimarSegundos(longo, 'shorts');
  assert.ok(s > 45 && s < 60, `estimativa ${s}`);
  assert.ok(checarScript(longo, { marca: MARCA_A, estilo: 'motion' }).some((e) => e.includes('shorts: duração estimada')));
  longo.limite_s = 60;
  assert.ok(!checarScript(longo, { marca: MARCA_A, estilo: 'motion' }).some((e) => e.includes('duração estimada')));
  longo.limite_s = 90;
  longo.lines[1].text = Array(200).fill('palavra').join(' ');
  assert.ok(checarScript(longo, { marca: MARCA_A, estilo: 'motion' }).some((e) => e.includes('limite de 60 s')));
});
