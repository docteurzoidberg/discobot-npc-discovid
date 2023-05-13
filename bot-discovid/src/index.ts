require('dotenv').config({
  path:
    `${__dirname}/../.env` +
    (process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''),
});

const fs = require('fs');
const { Signale } = require('signale');

const logger = new Signale();

const { Client, Collection, GatewayIntentBits } = require('discord.js');

//parsing env variables
const BOT_INVISIBLE = process.env.BOT_INVISIBLE === 'true';
const BOT_TOKEN = process.env.BOT_TOKEN || false;
const BOT_VERSION = process.env.BOT_VERSION || false;

const DATA_PATH = process.env.DATA_PATH || './data';

//test bot token is set
if (!BOT_TOKEN) {
  logger.fatal('BOT_TOKEN environment variable not set');
  process.exit(1);
}

//test bot version is set
if (!BOT_VERSION) {
  logger.fatal('BOT_VERSION environment variable not set');
  process.exit(1);
}

//test data path exists
if (!fs.existsSync(DATA_PATH)) {
  logger.fatal(`DATA_PATH ${DATA_PATH} doesn't exist`);
  process.exit(1);
}

//test data path is writable
try {
  const testFile = `${DATA_PATH}/.writetest`;
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
} catch (err) {
  logger.fatal(`DATA_PATH ${DATA_PATH} is not writable`);
  process.exit(-1);
}

//check if bot was updated
let updated = false;
let botVersion = false;
const botVersionFile = `${DATA_PATH}/.version`;

//check version file if exists
if (fs.existsSync(botVersionFile)) {
  //read version file
  try {
    botVersion = fs.readFileSync(botVersionFile, 'utf8');
  } catch (err) {
    logger.fatal("Can't read the bot .version file");
    process.exit(1);
  }
}

//check if bot was updated
if (botVersion !== BOT_VERSION) {
  updated = true;
  try {
    //write new version
    fs.writeFileSync(botVersionFile, BOT_VERSION);
  } catch (err) {
    logger.fatal("Can't update the .version file");
    process.exit(1);
  }
}

//prepare instance of Discord.js client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  presence: {
    status: BOT_INVISIBLE ? 'invisible' : 'online',
  },
});

//populate client with commands, events and everything needed by modules
client.logger = logger;
client.commands = new Collection();
client.buttons = new Collection();
client.updated = updated;
client.version = BOT_VERSION;
client.dataPath = DATA_PATH;
client.config = {
  USE_OPENAI: process.env.USE_OPENAI === 'true',
  INVISIBLE: BOT_INVISIBLE === 'true',
  ANNOUNCE_CHANNEL: process.env.ANNOUNCE_CHANNEL || false,
  ANNOUNCE_UPDATES: process.env.ANNOUNCE_UPDATES === 'true',
  ANNOUNCE_READY: process.env.ANNOUNCE_READY === 'true',
};

//load event modules
const eventFiles = fs
  .readdirSync(__dirname + '/events')
  .filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(__dirname + `/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

//load command modules
const commandFiles = fs
  .readdirSync(__dirname + '/commands')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(__dirname + `/commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

//handle process signals
async function closeGracefully(signal) {
  logger.warn(`Received signal to terminate: ${signal}, closing`);
  client.destroy();
  process.exit(0);
}
process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

//start discord's bot
client.login(BOT_TOKEN);
