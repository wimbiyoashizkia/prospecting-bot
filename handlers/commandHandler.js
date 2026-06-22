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

    const result = findClosestMineral(input, minerals);

    if (!result.found) {
        let msg = `❌ No results found for "${input}"`;

        if (result.suggestions.length) {

        const highConfidence =
            result.suggestions[0].score >= 20;

            msg += highConfidence
            ? "\n\nDid you mean?"
            : "\n\nOther possible matches:";

            for (const suggestion of result.suggestions) {
                msg += `\n• ${minerals[suggestion.name].name} (${Math.round(suggestion.score)}%)`;
            }
        } else {
            msg += "\n\nNo similar minerals found.";
        }
        
        return message.reply(msg);
    }

const mineral = minerals[result.name];

    const embed = new EmbedBuilder()
    .setTitle(
        mineral.name ||
        result.name.charAt(0).toUpperCase() + result.name.slice(1)
        )
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
