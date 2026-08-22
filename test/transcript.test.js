import test from 'node:test';
import assert from 'node:assert/strict';
import { safeName } from '../src/transcript.js';

test('safeName creates a valid Discord channel suffix', () => {
  assert.equal(safeName('Andréus Vinícius!!!'), 'andreus-vinicius');
});
