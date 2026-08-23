import 'dotenv/config';
import express from 'express';
import {
  AttachmentBuilder,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} from 'discord.js';
import { botConfig } from './config.js';
import { canCloseTicket, ticketData, ticketTopic } from './ticket.js';
import { renderTranscript, safeName } from './transcript.js';

const config = botConfig();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
app.disable('x-powered-by');
app.get('/', (_request, response) => response.json({
  service: 'andreus-discord-utility-bot',
  status: client.isReady() ? 'ready' : 'starting',
}));
app.get('/health', (_request, response) => response.json({ status: 'ok' }));
app.get('/ready', (_request, response) => response
  .status(client.isReady() ? 200 : 503)
  .json({ ready: client.isReady() }));

const server = app.listen(config.port, () => console.log(`Servidor HTTP online na porta ${config.port}.`));

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}.`);
});

client.on(Events.Error, (error) => console.error('Erro do cliente Discord:', error));

client.on(Events.GuildMemberAdd, async (member) => {
  if (!config.welcomeChannelId) return;
  try {
    const channel = await member.guild.channels.fetch(config.welcomeChannelId);
    if (channel?.isTextBased()) {
      await channel.send({
        content: `Bem-vindo(a), ${member}! Leia as regras e conte com a equipe quando precisar.`,
        allowedMentions: { users: [member.id] },
      });
    }
  } catch (error) {
    console.error('Não foi possível enviar a mensagem de boas-vindas:', error);
  }
});

async function createTicket(interaction) {
  await interaction.deferReply({ ephemeral: true });
  await interaction.guild.channels.fetch();
  const existing = interaction.guild.channels.cache.find((channel) =>
    ticketData(channel.topic)?.ownerId === interaction.user.id);
  if (existing) return interaction.editReply(`Você já tem um ticket aberto: ${existing}`);

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
  return interaction.editReply(`Ticket criado: ${channel}`);
}

async function saveTranscript(ownerId, channelName, content) {
  const fileName = `${channelName}.txt`;
  const attachment = () => new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: fileName });
  if (config.transcriptChannelId) {
    try {
      const archiveChannel = await client.channels.fetch(config.transcriptChannelId);
      if (archiveChannel?.isTextBased()) {
        await archiveChannel.send({
          content: `Transcript de **#${channelName}** · autor <@${ownerId}>`,
          files: [attachment()],
          allowedMentions: { parse: [] },
        });
        return 'canal de transcripts';
      }
    } catch (error) {
      console.error('Falha ao salvar no canal de transcripts; tentando enviar ao autor:', error);
    }
  }

  const owner = await client.users.fetch(ownerId);
  await owner.send({
    content: `Aqui está o transcript do seu ticket **#${channelName}**.`,
    files: [attachment()],
  });
  return 'mensagem direta do autor';
}

async function closeTicket(interaction) {
  const data = ticketData(interaction.channel?.topic);
  if (!interaction.channel?.isTextBased() || !data) {
    return interaction.reply({ content: 'Este comando só funciona em tickets.', ephemeral: true });
  }
  if (data.status === 'closing') {
    return interaction.reply({ content: 'Este ticket já está sendo encerrado.', ephemeral: true });
  }
  const memberRoleIds = interaction.member && 'roles' in interaction.member
    ? interaction.member.roles.cache
    : new Set();
  if (!canCloseTicket({
    userId: interaction.user.id,
    ownerId: data.ownerId,
    memberRoleIds,
    supportRoleId: config.supportRoleId,
  })) {
    return interaction.reply({
      content: 'Somente o autor ou a equipe pode fechar este ticket.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();
  await interaction.channel.setTopic(ticketTopic(data.ownerId, 'closing'), 'Ticket em encerramento');
  try {
    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    const content = renderTranscript(interaction.channel.name, fetched);
    const destination = await saveTranscript(data.ownerId, interaction.channel.name, content);
    await interaction.editReply(`Transcript salvo no ${destination}. Este canal será excluído em 5 segundos.`);
    setTimeout(() => interaction.channel?.delete('Ticket encerrado').catch((error) =>
      console.error('Não foi possível excluir o ticket:', error)), 5000);
  } catch (error) {
    await interaction.channel.setTopic(ticketTopic(data.ownerId), 'Falha ao encerrar ticket').catch(() => {});
    throw error;
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;
  try {
    if (interaction.commandName === 'ticket') await createTicket(interaction);
    if (interaction.commandName === 'fechar') await closeTicket(interaction);
  } catch (error) {
    console.error(`Falha no comando /${interaction.commandName}:`, error);
    const message = 'Não foi possível concluir o comando. Confira minhas permissões e tente novamente.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

async function shutdown(signal) {
  console.log(`${signal} recebido; encerrando conexões.`);
  client.destroy();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

client.login(config.token).catch((error) => {
  console.error('Falha ao autenticar no Discord:', error);
  server.close(() => process.exit(1));
});
