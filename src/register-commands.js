import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { registrationConfig } from './config.js';

const config = registrationConfig();
const commands = [
  new SlashCommandBuilder().setName('ticket').setDescription('Abre um ticket privado com a equipe'),
  new SlashCommandBuilder().setName('fechar').setDescription('Salva o transcript e fecha este ticket'),
].map((command) => command.toJSON());

await new REST({ version: '10' })
  .setToken(config.token)
  .put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });

console.log('Comandos registrados no servidor.');
