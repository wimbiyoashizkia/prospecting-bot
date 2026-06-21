require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const minerals = require('./data/minerals');
const commands = require('./data/commands');
const handleCommand = require('./handlers/commandHandler');

const PREFIX = '?';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const allCommands = {
  ...minerals,
  ...commands
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  handleCommand(message, allCommands);
});

client.login(process.env.DISCORD_TOKEN);
