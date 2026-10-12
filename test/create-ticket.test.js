import test from 'node:test';
import assert from 'node:assert/strict';
import { Collection, MessageFlags } from 'discord.js';
import { createTicket } from '../src/create-ticket.js';
import { ticketTopic } from '../src/ticket.js';

const ownerId = '123456789012345678';
const otherId = '223456789012345678';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function guild(id = '323456789012345678') {
  const cache = new Collection();
  const created = [];
  return {
    id,
    created,
    channels: {
      cache,
      async fetch() {},
      async create(options) {
        created.push(options);
        const channel = {
          topic: options.topic,
          async send() {},
          toString: () => `<#${created.length}>`,
        };
        cache.set(String(created.length), channel);
        return channel;
      },
    },
  };
}

function interaction(server, id = ownerId) {
  const replies = [];
  return {
    guild: server,
    user: { id, username: 'synthetic-user', tag: 'synthetic-user', toString: () => `<@${id}>` },
    replies,
    async deferReply(options) { assert.equal(options.flags, MessageFlags.Ephemeral); },
    async editReply(content) { replies.push(content); },
  };
}

test('overlapping requests for one owner create one ticket and give a useful private reply', async () => {
  const server = guild();
  const gate = deferred();
  const creationGate = deferred();
  server.channels.fetch = () => gate.promise;
  const create = server.channels.create;
  server.channels.create = async (options) => {
    await creationGate.promise;
    return create(options);
  };
  const first = interaction(server);
  const second = interaction(server);
  const pending = [createTicket(first, {}), createTicket(second, {})];
  await new Promise((done) => setImmediate(done));
  const busyReply = second.replies[0];
  const third = interaction(server);
  const thirdPending = createTicket(third, {});
  await new Promise((done) => setImmediate(done));
  const thirdBusyReply = third.replies[0];
  gate.resolve();
  await new Promise((done) => setImmediate(done));
  creationGate.resolve();
  await Promise.all([...pending, thirdPending]);
  assert.equal(server.created.length, 1);
  assert.match(busyReply, /aguarde.*tente novamente/i);
  assert.match(thirdBusyReply, /aguarde.*tente novamente/i);
  assert.match(first.replies[0], /Ticket criado/);
});

test('a later request recovers an existing ticket from channel metadata', async () => {
  const server = guild();
  server.channels.cache.set('existing', { topic: ticketTopic(ownerId), toString: () => '<#existing>' });
  const request = interaction(server);
  await createTicket(request, {});
  assert.equal(server.created.length, 0);
  assert.match(request.replies[0], /<#existing>/);
});

test('failures at each awaited opening step allow the owner to retry', async () => {
  for (const step of ['defer', 'fetch', 'create', 'send', 'reply']) {
    const server = guild();
    const originalCreate = server.channels.create;
    const request = interaction(server);
    const fail = async () => { throw new Error(step); };
    if (step === 'defer') request.deferReply = fail;
    if (step === 'fetch') server.channels.fetch = fail;
    if (step === 'create') server.channels.create = fail;
    if (step === 'send') {
      const create = server.channels.create;
      server.channels.create = async (options) => {
        const channel = await create(options);
        channel.send = fail;
        return channel;
      };
    }
    if (step === 'reply') request.editReply = fail;
    await assert.rejects(createTicket(request, {}), { message: step });
    server.channels.fetch = async () => {};
    if (step === 'create') server.channels.create = originalCreate;
    const retry = interaction(server);
    await createTicket(retry, {});
    assert.match(retry.replies[0], /Ticket criado|ticket aberto/);
    if (step === 'send' || step === 'reply') assert.equal(server.created.length, 1);
  }
});

test('different owners and the same owner in another guild proceed independently', async () => {
  const blockedServer = guild();
  const gate = deferred();
  blockedServer.channels.fetch = () => gate.promise;
  const blocked = createTicket(interaction(blockedServer), {});
  await new Promise((done) => setImmediate(done));
  const otherServer = guild('423456789012345678');
  // The other owner shares the guild but has a separately resolving channel fetch.
  blockedServer.channels.fetch = async () => {};
  try {
    const otherOwner = interaction(blockedServer, otherId);
    const otherGuild = interaction(otherServer);
    await Promise.all([createTicket(otherOwner, {}), createTicket(otherGuild, {})]);
    assert.match(otherOwner.replies[0], /Ticket criado/);
    assert.match(otherGuild.replies[0], /Ticket criado/);
  } finally {
    gate.resolve();
    await blocked;
  }
  assert.equal(blockedServer.created.length, 2);
  assert.equal(otherServer.created.length, 1);
});
