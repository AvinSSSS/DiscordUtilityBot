import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { registrationConfig } from './config.js';

const config = registrationConfig();

// Slash commands registrados no servidor de desenvolvimento configurado no .env.
const commands = [
  new SlashCommandBuilder().setName('ticket').setDescription('Abre um ticket privado com a equipe'),
  new SlashCommandBuilder().setName('fechar').setDescription('Salva o transcript e fecha este ticket'),
  new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Envia uma sugestão para votação')
    .addStringOption((option) => option
      .setName('texto')
      .setDescription('Descreva sua sugestão')
      .setMinLength(5)
      .setMaxLength(1000)
      .setRequired(true)),
].map((command) => command.toJSON());

// O endpoint de comandos do servidor atualiza os comandos imediatamente.
await new REST({ version: '10' })
  .setToken(config.token)
  .put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });

console.log('Comandos registrados no servidor.');
