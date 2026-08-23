const TOPIC_PATTERN = /^ticket-owner:(\d{17,20})(?:;status:(open|closing))?$/;

export function ticketTopic(ownerId, status = 'open') {
  return `ticket-owner:${ownerId};status:${status}`;
}

export function ticketData(topic) {
  const match = TOPIC_PATTERN.exec(topic || '');
  return match ? { ownerId: match[1], status: match[2] || 'open' } : null;
}

export function canCloseTicket({ userId, ownerId, memberRoleIds, supportRoleId }) {
  return userId === ownerId || Boolean(supportRoleId && memberRoleIds?.has(supportRoleId));
}
