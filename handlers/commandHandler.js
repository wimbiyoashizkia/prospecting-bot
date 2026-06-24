const { EmbedBuilder } = require("discord.js");

const commands = require("../data/commands");
const minerals = require("../data/minerals");
const dredge = require("../data/dredge");
const findClosestMineral = require("../utils/smartSearch");

const skipLocations = ["the void", "haunted creek", "north pole", "seashell isle"];

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

    if (input.startsWith("dredge ")) {
        const mineralName = input.slice(7).trim();

        if (!mineralName) {
            return message.reply("❌ Please specify a mineral.\nExample: `?dredge amber`");
        }

        const result = findClosestMineral(mineralName, minerals);

        if (!result.found) {
            let msg = `❌ No results found for "${mineralName}"`;

            if (result.suggestions.length) {
                const highConfidence = result.suggestions[0].score >= 20;
                msg += highConfidence
                    ? "\n\nDid you mean?"
                    : "\n\nOther possible matches:";

                for (const suggestion of result.suggestions) {
                    const mineral = minerals[suggestion.name];
                    msg += `\n• \`${mineral.name}\``;
                }
            } else {
                msg += "\n\nNo similar minerals found.";
            }

            return message.reply(msg);
        }

        const mineral = minerals[result.name];
        const guide = dredge[result.name];

        if (!guide) {
            return message.reply(`❌ No dredge guide found for "${mineral.name}".`);
        }

        const lines = mineral.data.split("\n");
        const locationLines = [];
        let foundLocations = false;

        for (const line of lines) {
            if (line.includes("**Locations & Chances**")) {
                foundLocations = true;
                continue;
            }

            if (foundLocations && line.trim() && line.includes("-")) {
                const trimmed = line.trim();
                const lowerTrimmed = trimmed.toLowerCase();
                const shouldSkip = skipLocations.some(skip => lowerTrimmed.includes(skip));
                if (!shouldSkip) {
                    locationLines.push(trimmed);
                    if (locationLines.length === 5) break;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`${guide.name} Dredge Guide`);

        embed.addFields({
            name: "Luck Setting",
            value: guide.luck,
            inline: false
        });

        embed.addFields({
            name: "Recommended Locations",
            value: locationLines.length > 0 ? locationLines.map(loc => `- ${loc}`).join("\n") : "No locations found",
            inline: false
        });

        embed.addFields({
            name: "Recommended Setup",
            value: `- Shovel Enchant: ${guide.setup.shovelEnchant}\n- Museum: ${guide.setup.museum}`,
            inline: false
        });

        if (guide.relics !== "-" && guide.relics.length > 0) {
            embed.addFields({
                name: "Recommended Relics",
                value: guide.relics.map(r => `- ${r}`).join("\n"),
                inline: false
            });
        }

        embed.setFooter({
            text: `Use ?${result.name} to view full mineral info.`
        });

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
                const mineral = minerals[suggestion.name];
                msg += `\n• \`${mineral.name}\``;

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
