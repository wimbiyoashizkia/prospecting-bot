require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const handleCommand = require('./handlers/commandHandler.js');

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

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot)
    return;
  if (!message.content.startsWith(PREFIX))
    return;

  handleCommand(message);
});

client.login(process.env.DISCORD_TOKEN);
