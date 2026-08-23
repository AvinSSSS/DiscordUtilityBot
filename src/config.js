const SNOWFLAKE = /^\d{17,20}$/;

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function optionalSnowflake(env, name) {
  const value = env[name]?.trim() || '';
  if (value && !SNOWFLAKE.test(value)) throw new Error(`${name} deve ser um ID válido do Discord.`);
  return value;
}

function port(env) {
  const value = Number(env.PORT || 8000);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
  }
  return value;
}

export function botConfig(env = process.env) {
  return Object.freeze({
    token: required(env, 'DISCORD_TOKEN'),
    welcomeChannelId: optionalSnowflake(env, 'WELCOME_CHANNEL_ID'),
    ticketCategoryId: optionalSnowflake(env, 'TICKET_CATEGORY_ID'),
    supportRoleId: optionalSnowflake(env, 'SUPPORT_ROLE_ID'),
    transcriptChannelId: optionalSnowflake(env, 'TRANSCRIPT_CHANNEL_ID'),
    port: port(env),
  });
}

export function registrationConfig(env = process.env) {
  return Object.freeze({
    token: required(env, 'DISCORD_TOKEN'),
    clientId: optionalSnowflake(env, 'DISCORD_CLIENT_ID') || required(env, 'DISCORD_CLIENT_ID'),
    guildId: optionalSnowflake(env, 'DISCORD_GUILD_ID') || required(env, 'DISCORD_GUILD_ID'),
  });
}
