export function safeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'usuario';
}

export function renderTranscript(channelName, messages, generatedAt = new Date()) {
  const lines = [`Transcript de #${channelName}`, `Gerado em ${generatedAt.toISOString()}`, ''];
  const values = typeof messages.values === 'function' ? [...messages.values()] : [...messages];
  for (const message of values.reverse()) {
    const attachments = [...message.attachments.values()].map((item) => item.url).join(' ');
    const author = message.author?.tag || message.author?.username || 'usuário desconhecido';
    lines.push(`[${message.createdAt.toISOString()}] ${author}: ${message.cleanContent || ''} ${attachments}`.trimEnd());
  }
  return lines.join('\n');
}
