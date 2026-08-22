import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];
for (const name of required) if (!process.env[name]) throw new Error(`Variável obrigatória ausente: ${name}`);
const commands = [
  new SlashCommandBuilder().setName('ticket').setDescription('Abre um ticket privado com a equipe'),
  new SlashCommandBuilder().setName('fechar').setDescription('Fecha este ticket e gera o transcript'),
].map((command) => command.toJSON());
await new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN).put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands });
console.log('Comandos registrados.');
