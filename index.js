const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ores = {

};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (!message.content.startsWith('?')) return;

  const command = message.content.slice(1).toLowerCase();

  if (ores[command]) {
    message.reply(ores[command]);
  }
});

client.login("TOKEN");
