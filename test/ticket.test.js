import test from 'node:test';
import assert from 'node:assert/strict';
import { canCloseTicket, ticketData, ticketTopic } from '../src/ticket.js';

const ownerId = '123456789012345678';
const supportRoleId = '987654321098765432';

test('ticket topic round-trips owner and status', () => {
  assert.deepEqual(ticketData(ticketTopic(ownerId)), { ownerId, status: 'open' });
  assert.deepEqual(ticketData(ticketTopic(ownerId, 'closing')), { ownerId, status: 'closing' });
  assert.equal(ticketData('canal-comum'), null);
});

test('only owner or configured support role can close', () => {
  assert.equal(canCloseTicket({ userId: ownerId, ownerId, memberRoleIds: new Set(), supportRoleId }), true);
  assert.equal(canCloseTicket({ userId: '111111111111111111', ownerId, memberRoleIds: new Set([supportRoleId]), supportRoleId }), true);
  assert.equal(canCloseTicket({ userId: '111111111111111111', ownerId, memberRoleIds: new Set(), supportRoleId }), false);
});
