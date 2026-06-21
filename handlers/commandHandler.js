module.exports = (message, allCommands) => {
  const command = message.content.slice(1).toLowerCase();

  const target = allCommands[command];

  if (!target) {
    return message.reply('Command not found.');
  }

  return message.reply(target.data);
};
