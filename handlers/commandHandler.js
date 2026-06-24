const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const commands = require("../data/commands");
const minerals = require("../data/minerals");
const dredge = require("../data/dredge");
const findClosestMineral = require("../utils/smartSearch");

const skipLocations = ["the void", "haunted creek", "north pole", "seashell isle"];

function createSuggestionButtons(suggestions) {
    const row = new ActionRowBuilder();
    for (const suggestion of suggestions) {
        const mineral = minerals[suggestion.name];
        const displayName = mineral?.name || suggestion.name;

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`cmd_${suggestion.name}`)
                .setLabel(displayName)
                .setStyle(ButtonStyle.Primary)
        );
    }
    return row;
}

function buildMineralEmbed(mineral, displayName) {
    const embed = new EmbedBuilder()
        .setTitle(mineral.name || displayName.charAt(0).toUpperCase() + displayName.slice(1))
        .setDescription(mineral.data);

    if (mineral.description) {
        embed.setFooter({ text: mineral.description });
    }

    return embed;
}

function buildDredgeEmbed(mineral, guide) {
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

    embed.addFields({ name: "Luck Setting", value: guide.luck, inline: false });
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

    embed.setFooter({ text: `Use ?${mineral.name?.toLowerCase() || ""} to view full mineral info.` });

    return embed;
}

async function showSuggestions(message, input, suggestions) {
    const highConfidence = suggestions[0].score >= 20;
    const label = highConfidence ? "Did you mean?" : "Other possible matches:";

    const row = createSuggestionButtons(suggestions);

    const reply = await message.reply({
        content: `❌ No results found for \`${input}\`\n\n**${label}**`,
        components: [row]
    });

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000
    });

    collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({
                content: "This button is not for you.",
                ephemeral: true
            });
        }

        const chosen = interaction.customId.replace("cmd_", "");
        collector.stop();
        await interaction.update({ components: [] });

        const isDredge = input.startsWith("dredge ");
        const newContent = isDredge ? `?dredge ${chosen}` : `?${chosen}`;
        message.content = newContent;

        return processCommand(message);
    });

    collector.on("end", async (collected, reason) => {
        if (reason === "time") {
            await reply.edit({ components: [] }).catch(() => {});
        }
    });
}

async function handleDredge(message, input) {
    const mineralName = input.slice(7).trim();

    if (!mineralName) {
        return message.reply("❌ Please specify a mineral.\nExample: `?dredge amber`");
    }

    const result = findClosestMineral(mineralName);

    if (!result.found) {
        if (result.suggestions.length > 0) {
            return showSuggestions(message, input, result.suggestions);
        }
        return message.reply(`❌ No results found for \`${mineralName}\`\n\nNo similar minerals found.`);
    }

    const mineral = minerals[result.name];
    const guide = dredge[result.name];

    if (!guide) {
        const embed = new EmbedBuilder()
            .setTitle(`${mineral.name} — Dredge Guide`)
            .setDescription("❌ Dredge guide data is not available for this mineral yet.")
            .setFooter({ text: `Use ?${result.name} to view full mineral info.` });

        return message.reply({ embeds: [embed] });
    }

    const embed = buildDredgeEmbed(mineral, guide);
    return message.reply({ embeds: [embed] });
}

async function handleMineralLookup(message, input) {
    const result = findClosestMineral(input);

    if (!result.found) {
        if (result.suggestions.length > 0) {
            return showSuggestions(message, input, result.suggestions);
        }
        return message.reply(`❌ No results found for \`${input}\`\n\nNo similar minerals found.`);
    }

    const mineral = minerals[result.name];
    const embed = buildMineralEmbed(mineral, result.name);
    return message.reply({ embeds: [embed] });
}

async function processCommand(message) {
    try {
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
                embed.setFooter({ text: cmd.description || "" });
            }

            return message.reply({ embeds: [embed] });
        }

        const dredgeAliases = ["dredge", "dredg", "dred", "dre", "dr", "d"];
        const inputParts = input.split(" ");
        const commandPart = inputParts[0];
        const hasMineralQuery = inputParts.length > 1 && inputParts[1].trim().length > 0;

        if (dredgeAliases.includes(commandPart) && hasMineralQuery) {
            const normalizedInput = "dredge " + inputParts.slice(1).join(" ");
            return handleDredge(message, normalizedInput);
        }

        if (dredgeAliases.includes(commandPart) && !hasMineralQuery) {
            return message.reply("❌ Please specify a mineral.\nExample: `?dredge amber`");
        }

        return handleMineralLookup(message, input);

    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        return message.reply("❌ An error occurred while processing your command.");
    }
}

module.exports = processCommand;
