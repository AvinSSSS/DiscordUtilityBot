export function safeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'usuario';
}

export function renderTranscript(channelName, messages) {
  const lines = [`Transcript de #${channelName}`, `Gerado em ${new Date().toISOString()}`, ''];
  for (const message of [...messages].reverse()) {
    const attachments = [...message.attachments.values()].map((item) => item.url).join(' ');
    lines.push(`[${message.createdAt.toISOString()}] ${message.author.tag}: ${message.cleanContent || ''} ${attachments}`.trimEnd());
  }
  return lines.join('\n');
}
