import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { ticketData, ticketTopic } from './ticket.js';
import { safeName } from './transcript.js';

const pendingTickets = new Set();

/** Cria um canal privado e impede que o mesmo usuário mantenha dois tickets. */
export async function createTicket(interaction, config) {
  const key = `${interaction.guild.id}:${interaction.user.id}`;
  const pending = pendingTickets.has(key);
  if (!pending) pendingTickets.add(key);
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (pending) {
      return await interaction.editReply('Seu ticket está sendo criado; aguarde e tente novamente em instantes.');
    }
    await interaction.guild.channels.fetch();
    const existing = interaction.guild.channels.cache.find((channel) =>
      ticketData(channel.topic)?.ownerId === interaction.user.id);
    if (existing) return await interaction.editReply(`Você já tem um ticket aberto: ${existing}`);

    // @everyone perde acesso; autor e equipe recebem apenas as permissões necessárias.
    const permissionOverwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ];
    if (config.supportRoleId) {
      permissionOverwrites.push({
        id: config.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${safeName(interaction.user.username)}`,
      type: ChannelType.GuildText,
      parent: config.ticketCategoryId || undefined,
      topic: ticketTopic(interaction.user.id),
      permissionOverwrites,
      reason: `Ticket aberto por ${interaction.user.tag}`,
    });
    await channel.send({
      content: `${interaction.user}, descreva sua necessidade. Use /fechar quando terminar.`,
      allowedMentions: { users: [interaction.user.id] },
    });
    return await interaction.editReply(`Ticket criado: ${channel}`);
  } finally {
    if (!pending) pendingTickets.delete(key);
  }
}
