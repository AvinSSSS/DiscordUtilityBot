import test from 'node:test';
import assert from 'node:assert/strict';
import { botConfig, registrationConfig } from '../src/config.js';

test('botConfig applies defaults and accepts optional IDs', () => {
  const config = botConfig({ DISCORD_TOKEN: 'secret', PORT: '9000', SUPPORT_ROLE_ID: '123456789012345678' });
  assert.equal(config.port, 9000);
  assert.equal(config.supportRoleId, '123456789012345678');
  assert.equal(config.welcomeChannelId, '');
});

test('botConfig rejects invalid ports and Discord IDs', () => {
  assert.throws(() => botConfig({ DISCORD_TOKEN: 'secret', PORT: 'zero' }), /PORT/);
  assert.throws(() => botConfig({ DISCORD_TOKEN: 'secret', SUPPORT_ROLE_ID: 'abc' }), /SUPPORT_ROLE_ID/);
});

test('registrationConfig requires all registration secrets', () => {
  assert.throws(() => registrationConfig({ DISCORD_TOKEN: 'secret' }), /DISCORD_CLIENT_ID/);
});
