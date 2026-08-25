// O tópico do canal funciona como um pequeno registro persistente do ticket.
// Assim, o bot recupera autor e estado mesmo depois de ser reiniciado.
const TOPIC_PATTERN = /^ticket-owner:(\d{17,20})(?:;status:(open|closing))?$/;

/** Monta o tópico interno usado para identificar um canal de ticket. */
export function ticketTopic(ownerId, status = 'open') {
  return `ticket-owner:${ownerId};status:${status}`;
}

/** Extrai os metadados do tópico ou retorna null para canais comuns. */
export function ticketData(topic) {
  const match = TOPIC_PATTERN.exec(topic || '');
  return match ? { ownerId: match[1], status: match[2] || 'open' } : null;
}

/** Autoriza o autor do ticket ou um membro que possua o cargo de suporte. */
export function canCloseTicket({ userId, ownerId, memberRoleIds, supportRoleId }) {
  return userId === ownerId || Boolean(supportRoleId && memberRoleIds?.has(supportRoleId));
}
