import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarPostar, comandoCapa, comandoDuracao, comandoFolha } from '../lib/entrega.mjs';

const script = { sources: ['Mayo Clinic'], postar: { titulo: 'Engoliu chiclete?', descricao: 'O que acontece de verdade.', hashtags: ['curiosidades', '#ciencia'] } };

test('marca A gera blocos de TikTok e Shorts, sem Reels', () => {
  const md = montarPostar(script, { nome: 'Conhecimento geral', perfis: { tiktok: 'p', youtube: 'p' } });
  assert.match(md, /## TikTok/);
  assert.match(md, /## YouTube Shorts/);
  assert.doesNotMatch(md, /Instagram/);
  assert.match(md, /#curiosidades #ciencia #shorts/);
  assert.match(md, /- Mayo Clinic/);
  assert.match(md, /`shorts\.mp4`/);
});

test('marca B inclui Reels', () => {
  const md = montarPostar(script, { nome: 'Hacker', perfis: { tiktok: 'p', instagram: 'p', youtube: 'p' } });
  assert.match(md, /## Instagram Reels/);
  assert.match(md, /`reels\.mp4`/);
});

test('comandos de capa e duração', () => {
  const c = comandoCapa('a.mp4', 'c.jpg', 1.5);
  assert.equal(c.cmd, 'ffmpeg');
  assert.deepEqual(c.args, ['-v', 'error', '-y', '-ss', '1.5', '-i', 'a.mp4', '-frames:v', '1', '-q:v', '2', 'c.jpg']);
  const d = comandoDuracao('a.mp4');
  assert.equal(d.cmd, 'ffprobe');
  assert.equal(d.args.at(-1), 'a.mp4');
});

test('comando da folha de contato', () => {
  const c = comandoFolha('a.mp4', 'f.jpg');
  assert.equal(c.cmd, 'ffmpeg');
  assert.deepEqual(c.args, ['-v', 'error', '-y', '-i', 'a.mp4', '-vf', 'fps=1,scale=216:384,tile=10x3:padding=4', '-frames:v', '1', 'f.jpg']);
});

test('hashtags com espaços são coladas', () => {
  const md = montarPostar({ ...script, postar: { ...script.postar, hashtags: ['voce sabia', '#a  b'] } }, { nome: 'C', perfis: { tiktok: 'p' } });
  assert.match(md, /#vocesabia #ab/);
});
