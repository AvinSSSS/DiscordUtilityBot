/**
 * Converte um nome de usuário em um sufixo seguro para nomes de canal do Discord.
 * Remove acentos, espaços, símbolos e limita o resultado a 60 caracteres.
 */
export function safeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'usuario';
}

/** Transforma uma coleção de mensagens em um transcript de texto cronológico. */
export function renderTranscript(channelName, messages, generatedAt = new Date()) {
  const lines = [`Transcript de #${channelName}`, `Gerado em ${generatedAt.toISOString()}`, ''];
  const values = typeof messages.values === 'function' ? [...messages.values()] : [...messages];
  // A API retorna primeiro as mensagens mais recentes; o arquivo usa ordem cronológica.
  for (const message of values.reverse()) {
    const attachments = [...message.attachments.values()].map((item) => item.url).join(' ');
    const author = message.author?.tag || message.author?.username || 'usuário desconhecido';
    lines.push(`[${message.createdAt.toISOString()}] ${author}: ${message.cleanContent || ''} ${attachments}`.trimEnd());
  }
  return lines.join('\n');
}
