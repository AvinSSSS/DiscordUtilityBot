import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTranscript, safeName } from '../src/transcript.js';

test('safeName creates a valid and bounded Discord channel suffix', () => {
  assert.equal(safeName('Andréus Vinícius!!!'), 'andreus-vinicius');
  assert.equal(safeName('🔥🔥🔥'), 'usuario');
  assert.equal(safeName('a'.repeat(100)).length, 60);
});

test('renderTranscript orders oldest messages first and keeps attachments', () => {
  const newer = {
    createdAt: new Date('2026-08-23T10:01:00Z'),
    author: { tag: 'Cliente#0001' },
    cleanContent: 'segue imagem',
    attachments: new Map([['1', { url: 'https://cdn.example/imagem.png' }]]),
  };
  const older = {
    createdAt: new Date('2026-08-23T10:00:00Z'),
    author: { tag: 'Suporte#0001' },
    cleanContent: 'olá',
    attachments: new Map(),
  };
  const messages = new Map([['newer', newer], ['older', older]]);
  const output = renderTranscript('ticket-teste', messages, new Date('2026-08-23T11:00:00Z'));
  assert.match(output, /Gerado em 2026-08-23T11:00:00.000Z/);
  assert.ok(output.indexOf('Suporte#0001') < output.indexOf('Cliente#0001'));
  assert.match(output, /https:\/\/cdn\.example\/imagem\.png/);
});
