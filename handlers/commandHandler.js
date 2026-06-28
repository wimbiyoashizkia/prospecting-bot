const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const commands = require("../data/commands");
const minerals = require("../data/minerals");
const dredge = require("../data/dredge");
const findClosestMineral = require("../utils/smartSearch");

const skipLocations = ["the void", "haunted creek", "north pole", "seashell isle"];

const mineralColors = {
    amethyst: "#A44AD1",
    blueice: "#5B9BD5",
    copper: "#C19358",
    gold: "#F0BE41",
    obsidian: "#1F1F1F",
    pearl: "#E5E6E6",
    platinum: "#86999C",
    pyrite: "#B28F31",
    seashell: "#E5CDA3",
    silver: "#C3CEC9",
    coral: "#4B54A6",
    electrum: "#AEC035",
    glowberry: "#FDB830",
    malachite: "#1A7A40",
    neodymium: "#7A7A7A",
    nickel: "#DFD6BA",
    rockcandy: "#CD6A7A",
    sapphire: "#2A4AF4",
    smokyquartz: "#9B8E85",
    titanium: "#878A8E",
    topaz: "#FCDC4E",
    zircon: "#B4512E",
    amber: "#E79228",
    azuralite: "#5699D1",
    candycane: "#E53B3B",
    diopside: "#3FA65D",
    glacialquartz: "#6BA5C4",
    gloomberry: "#7036E9",
    jade: "#3FCF75",
    lapislazuli: "#2F4696",
    meteoriciron: "#D17D35",
    onyx: "#23170D",
    peridot: "#7FD741",
    pyrelith: "#BFA58A",
    ruby: "#EA5D5D",
    silverclamshell: "#CEE3F5",
    ammonitefossil: "#B7A58D",
    ashvein: "#4B4852",
    aurorite: "#4892ED",
    bone: "#E6D2B5",
    borealite: "#1E504B",
    cobalt: "#3C78D8",
    emerald: "#2EE08B",
    glowmoss: "#44592D",
    goldenpearl: "#F3ED8C",
    iridium: "#C6C8CA",
    lightshard: "#5B95FC",
    mercury: "#DDE6EA",
    meteoricgold: "#E88332",
    moonstone: "#EFE6D3",
    opal: "#EBECEE",
    osmium: "#4E698C",
    pyronium: "#E64128",
    aetherite: "#9070D3",
    aquamarine: "#72B5A7",
    bismuth: "#8C8E98",
    catseye: "#3C2C1E",
    cinnabar: "#9B2222",
    depletedshard: "#A628E0",
    diamond: "#D8F1F7",
    dragonbone: "#5A1F22",
    fireopal: "#E86A23",
    fireflystone: "#F9F2AC",
    gloomcap: "#4BF0FC",
    lostsoul: "#6BD1FA",
    luminum: "#F6F6AF",
    nautilusshell: "#E0D4C2",
    palladium: "#D98A46",
    peppermintprism: "#A9F0A3",
    radium: "#3F402D",
    rosegold: "#DB9596",
    specterite: "#D1E2EB",
    starshine: "#E86182",
    tourmaline: "#C9D96A",
    uranium: "#3FE045",
    volcanickey: "#CF6425",
    aetherium: "#872BFF",
    chrysoberyl: "#D6EBA0",
    flarebloom: "#D96B1E",
    frostshard: "#E9F0F2",
    inferlume: "#EAA74A",
    mythril: "#3CE0B0",
    painite: "#692236",
    pinkdiamond: "#F9D4F4",
    prismara: "#A9D06B",
    radiantgold: "#A66626",
    redberyl: "#C44962",
    stargarnet: "#AA3A5C",
    sunstone: "#DCA23C",
    vortessence: "#D6C07F",
    volcaniccore: "#C57632",
    adamantine: "#1FB4EF",
    astralspore: "#7255E0",
    bloodstone: "#9E2025",
    celestium: "#F330A6",
    cryonicartifact: "#36C1E8",
    dinosaurskull: "#D8CCB4",
    eternium: "#E2F6E9",
    forgottentotem: "#F4E8BD",
    northstar: "#FAFAE9",
    pumpkinsoul: "#E08A40",
    singularium: "#0A0A0A",
    starpiercer: "#C5C5C7",
    umbrite: "#5D155E",
    vineheart: "#C4FA38",
    voidstone: "#7A7A7A"
};

function createSuggestionButtons(suggestions) {
    const row = new ActionRowBuilder();
    const styles = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Secondary];

    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        const mineral = minerals[suggestion.name];
        const displayName = mineral?.name || suggestion.name;

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`cmd_${suggestion.name}`)
                .setLabel(displayName)
                .setStyle(styles[i] || ButtonStyle.Primary)
        );
    }
    return row;
}

function buildMineralEmbed(mineral, displayName) {
    const color = mineralColors[mineral.name?.toLowerCase()] || "#5865F2";

    let description = mineral.data;

    if (mineral.bestLocation && mineral.bestLocation !== "N/A") {
        const bestLine = `**Best Location:** ${mineral.bestLocation}`;
        description = `${bestLine}\n\n${description}`;
    }

    const embed = new EmbedBuilder()
        .setTitle(mineral.name || displayName.charAt(0).toUpperCase() + displayName.slice(1))
        .setDescription(description)
        .setColor(color);

    if (mineral.description) {
        embed.setFooter({ text: mineral.description });
    }

    return embed;
}

function buildDredgeEmbed(mineral, guide) {
    const color = mineralColors[mineral.name?.toLowerCase()] || "#00FF00";

    let locationLines = [];

    let allLocs = mineral.locations ? [...mineral.locations] : [];

    allLocs = allLocs.filter(loc => loc && loc.location && loc.location.trim() !== '');

    allLocs = allLocs.filter(loc => {
        const lowerLoc = loc.location.toLowerCase();
        return !skipLocations.some(skip => lowerLoc.includes(skip));
    });

    allLocs.sort((a, b) => b.chance_percent - a.chance_percent);

    const topLocs = allLocs.slice(0, 5);

    for (const loc of topLocs) {
        const chance = loc.chance_percent;
        const oneIn = chance > 0 ? Math.round(100 / chance) : 0;
        let line = `${loc.location} - (~1 in ${oneIn})`;
        locationLines.push(`- ${line}`);
    }

    locationLines = locationLines.filter(line => line && line.trim() !== '');

    const embed = new EmbedBuilder()
        .setTitle(`${guide.name} Dredge Guide`)
        .setColor(color);

    embed.addFields({ name: "Luck Setting", value: guide.luck, inline: false });
    embed.addFields({
        name: "Recommended Locations",
        value: locationLines.length > 0 ? locationLines.join("\n").trim() : "No locations found",
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
