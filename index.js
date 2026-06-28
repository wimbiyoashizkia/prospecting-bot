require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const handleCommand = require('./handlers/commandHandler.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

process.on('unhandledRejection', (error) => {
    console.error(`[${new Date().toISOString()}] Unhandled Rejection:`, error);
});
process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
});

process.on('SIGINT', () => {
    console.log(`[${new Date().toISOString()}] Shutting down gracefully...`);
    client.destroy();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] Shutting down gracefully...`);
    client.destroy();
    process.exit(0);
});

client.once('ready', () => {
    console.log(`[${new Date().toISOString()}] Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('?')) return;
    handleCommand(message);
});

if (!process.env.DISCORD_TOKEN) {
    console.error(`[${new Date().toISOString()}] [FATAL] DISCORD_TOKEN is missing in .env`);
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error(`[${new Date().toISOString()}] [FATAL] Failed to login:`, error);
    process.exit(1);
});
