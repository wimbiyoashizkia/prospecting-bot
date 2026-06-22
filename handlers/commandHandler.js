const { EmbedBuilder } = require("discord.js");

const commands = require("../data/commands");
const minerals = require("../data/minerals");
const findClosestMineral = require("../utils/smartSearch");

module.exports = async (message) => {
    if (message.author.bot) return;

    const prefix = "?";
    if (!message.content.startsWith(prefix)) return;

    const input = message.content
        .slice(prefix.length)
        .trim()
        .toLowerCase();

    if (commands[input]) {
        const cmd = commands[input];

        const embed = new EmbedBuilder()
            .setTitle(cmd.name || input.toUpperCase())
            .setDescription(cmd.data);

        if (cmd.description) {
            embed.setFooter({
                text: cmd.description || ""
            });
        }

        return message.reply({
            embeds: [embed]
        });
    }

    const mineralName = findClosestMineral(input, minerals);

    if (!mineralName) {
        return;
    }

    const mineral = minerals[mineralName];

    const embed = new EmbedBuilder()
    .setTitle(mineral.name || mineralName.charAt(0).toUpperCase() + mineralName.slice(1))
    .setDescription(mineral.data);

    if (mineral.description) {
        embed.setFooter({
            text: mineral.description
        });
    }

    return message.reply({
        embeds: [embed]
    });
};
