module.exports = (message, minerals, commands) => {
  const command = message.content.slice(1).toLowerCase();

  if (minerals[command]) {
    return message.reply(minerals[command]);
  }

  if (commands[command]) {
    return message.reply(commands[command]);
  }
};
