const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

const { Signale } = require('signale');

const logger = new Signale();

require('dotenv').config({
  path:
    __dirname +
    '/../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

const BOT_TOKEN = process.env.BOT_TOKEN || false;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || false;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || false;

if (!BOT_TOKEN) {
  logger.fatal('BOT_TOKEN environment variable not set');
  process.exit(1);
}

if (!DISCORD_CLIENT_ID) {
  logger.fatal('DISCORD_CLIENT_ID environment variable not set');
  process.exit(1);
}

if (!DISCORD_GUILD_ID) {
  logger.fatal('DISCORD_GUILD_ID environment variable not set');
  process.exit(1);
}

const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

// for guild-based commands
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
      {
        body: [],
      }
    );
    logger.info('Successfully deleted all guild commands.');
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();

// for global commands
(async () => {
  try {
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: [] });
    logger.info('Successfully deleted all global commands.');
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();
