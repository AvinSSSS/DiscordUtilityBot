import 'dotenv/config';
import express from 'express';
import { AttachmentBuilder, ChannelType, Client, Events, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { renderTranscript, safeName } from './transcript.js';

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN não configurado.');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const app = express();
app.get('/', (_request, response) => response.json({ status: client.isReady() ? 'ready' : 'starting', service: 'andreus-discord-bot' }));
app.get('/health', (_request, response) => response.status(client.isReady() ? 200 : 503).json({ ready: client.isReady() }));
app.listen(Number(process.env.PORT || 8000), () => console.log('Health server online.'));

client.once(Events.ClientReady, (readyClient) => console.log(`Bot conectado como ${readyClient.user.tag}`));
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send(`Bem-vindo(a), ${member}! Leia as regras e conte com a equipe quando precisar.`);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;
  if (interaction.commandName === 'ticket') {
    const existing = interaction.guild.channels.cache.find((channel) => channel.topic === `ticket-owner:${interaction.user.id}`);
    if (existing) return interaction.reply({ content: `Você já tem um ticket aberto: ${existing}`, ephemeral: true });
    const overwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ];
    if (process.env.SUPPORT_ROLE_ID) overwrites.push({ id: process.env.SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    const channel = await interaction.guild.channels.create({ name: `ticket-${safeName(interaction.user.username)}`, type: ChannelType.GuildText, parent: process.env.TICKET_CATEGORY_ID || undefined, topic: `ticket-owner:${interaction.user.id}`, permissionOverwrites: overwrites });
    await channel.send(`${interaction.user}, descreva sua necessidade. Use /fechar quando terminar.`);
    return interaction.reply({ content: `Ticket criado: ${channel}`, ephemeral: true });
  }
  if (interaction.commandName === 'fechar') {
    if (!interaction.channel?.isTextBased() || !interaction.channel.topic?.startsWith('ticket-owner:')) return interaction.reply({ content: 'Este comando só funciona em tickets.', ephemeral: true });
    const ownerId = interaction.channel.topic.split(':')[1];
    const member = interaction.member;
    const isSupport = Boolean(process.env.SUPPORT_ROLE_ID && 'roles' in member && member.roles.cache.has(process.env.SUPPORT_ROLE_ID));
    if (interaction.user.id !== ownerId && !isSupport) return interaction.reply({ content: 'Somente o autor ou a equipe pode fechar este ticket.', ephemeral: true });
    await interaction.deferReply();
    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    const file = new AttachmentBuilder(Buffer.from(renderTranscript(interaction.channel.name, fetched), 'utf8'), { name: `${interaction.channel.name}.txt` });
    await interaction.editReply({ content: 'Ticket encerrado. Transcript anexado:', files: [file] });
    setTimeout(() => interaction.channel?.delete('Ticket encerrado').catch(console.error), 5000);
  }
});
client.login(process.env.DISCORD_TOKEN);
