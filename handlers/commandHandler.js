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

function shakeSpeedToR(x) {
    x = Math.max(0, Number(x) || 0);
    x = Math.min(x, 3000);
    return (4.03266e-9 * Math.pow(x, 3)) -
           (1.68935e-5 * Math.pow(x, 2)) +
           (0.0255557 * x) +
           0.206594;
}

function attemptsForTarget(pAttempt, target) {
    if (!isFinite(pAttempt) || pAttempt <= 0) return Infinity;
    if (pAttempt >= 1) return 1;
    return Math.log(1 - target) / Math.log(1 - pAttempt);
}

function fmtDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '∞';
    if (seconds === Infinity) return '∞';
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

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

    const embed = new EmbedBuilder()
        .setTitle(mineral.name || displayName.charAt(0).toUpperCase() + displayName.slice(1))
        .setDescription(mineral.data)
        .setColor(color);

    if (mineral.description) {
        embed.setFooter({ text: mineral.description });
    }

    return embed;
}

function buildDredgeEmbed(mineral, guide) {
    const color = mineralColors[mineral.name?.toLowerCase()] || "#00FF00";

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
        .setTitle(`${guide.name} Dredge Guide`)
        .setColor(color);

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

async function handleCalc(message, input) {
    const parts = input.slice(5).trim().split(/\s+/);
    const mineralName = parts[0];

    if (!mineralName) {
        return message.reply(
            "Usage: `?calc <mineral> [luck] [capacity] [digStrength] [digSpeed] [shakeStrength] [shakeSpeed]`\n" +
            "Example: `?calc ruby 500 200 3 100 1 500`"
        );
    }

    const luck = parseInt(parts[1]) || 100;
    const capacity = parseInt(parts[2]) || 50;
    const digStrength = parseInt(parts[3]) || 3;
    const digSpeed = parseInt(parts[4]) || 100;
    const shakeStrength = parseFloat(parts[5]) || 1;
    const shakeSpeed = parseInt(parts[6]) || 500;

    const result = findClosestMineral(mineralName);

    if (!result.found) {
        let msg = `Mineral "${mineralName}" not found.`;
        if (result.suggestions.length) {
            msg += "\n\nDid you mean?";
            for (const suggestion of result.suggestions) {
                msg += `\n• ${minerals[suggestion.name].name}`;
            }
        }
        return message.reply(msg);
    }

    const mineral = minerals[result.name];
    const baseData = mineral.data;
    const lines = baseData.split('\n');
    let found = false;
    const locations = [];

    for (const line of lines) {
        if (line.includes('**Locations & Chances**')) {
            found = true;
            continue;
        }
        if (!found) continue;
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts2 = trimmed.split(' - ');
        if (parts2.length < 2) continue;
        const chance = parseFloat(parts2[1].replace('%', '')) || 0;
        locations.push({
            location: parts2[0].trim(),
            chance_percent: chance
        });
    }

    if (locations.length === 0) {
        return message.reply(`No location data found for "${mineral.name}".`);
    }

    const rolls = luck * capacity;
    const r = shakeSpeedToR(shakeSpeed);
    const rs = r * shakeStrength;
    let cycleSeconds = Infinity;
    if (rs > 0) {
        cycleSeconds = capacity / rs + 0.75 + 190 * (Math.max(0, digStrength - 1)) / digSpeed;
    }

    let bestLoc = locations[0];
    let bestP = 0;
    for (const loc of locations) {
        const p = loc.chance_percent / 100;
        const pAttempt = 1 - Math.pow(1 - p, rolls);
        if (pAttempt > bestP) {
            bestP = pAttempt;
            bestLoc = loc;
        }
    }

    const bestPct = bestLoc.chance_percent / 100;
    const pAttemptBest = 1 - Math.pow(1 - bestPct, rolls);
    const expected = rolls * bestPct;

    const a50 = attemptsForTarget(pAttemptBest, 0.50);
    const a90 = attemptsForTarget(pAttemptBest, 0.90);
    const a99 = attemptsForTarget(pAttemptBest, 0.99);

    const t50 = isFinite(a50) && isFinite(cycleSeconds) ? a50 * cycleSeconds : Infinity;
    const t90 = isFinite(a90) && isFinite(cycleSeconds) ? a90 * cycleSeconds : Infinity;
    const t99 = isFinite(a99) && isFinite(cycleSeconds) ? a99 * cycleSeconds : Infinity;

    const embed = new EmbedBuilder()
        .setTitle(`${mineral.name} - Farming Calculator`)
        .setColor(mineralColors[mineral.name?.toLowerCase()] || '#5865F2')
        .addFields(
            {
                name: 'Setup',
                value:
                    `Luck: ${luck}\n` +
                    `Capacity: ${capacity}\n` +
                    `Dig Strength: ${digStrength}\n` +
                    `Dig Speed: ${digSpeed}%\n` +
                    `Shake Strength: ${shakeStrength}\n` +
                    `Shake Speed: ${shakeSpeed}%`,
                inline: true
            },
            {
                name: 'Results',
                value:
                    `Chance per attempt: ${(pAttemptBest * 100).toFixed(5)}%\n` +
                    `~1 in ${pAttemptBest > 0 ? Math.round(1 / pAttemptBest).toLocaleString() : '∞'} attempts\n` +
                    `Expected finds: ${expected.toFixed(4)}`,
                inline: true
            },
            {
                name: 'Time Estimates',
                value:
                    `50%: ${isFinite(a50) ? Math.round(a50).toLocaleString() : '∞'} attempts (${fmtDuration(t50)})\n` +
                    `90%: ${isFinite(a90) ? Math.round(a90).toLocaleString() : '∞'} attempts (${fmtDuration(t90)})\n` +
                    `99%: ${isFinite(a99) ? Math.round(a99).toLocaleString() : '∞'} attempts (${fmtDuration(t99)})`,
                inline: false
            },
            {
                name: 'Best Location',
                value: `${bestLoc.location} - ${bestLoc.chance_percent.toFixed(8)}%`,
                inline: false
            },
            {
                name: 'Full Details',
                value: 'https://wimbiyoashizkia.github.io/prospecting-bot/',
                inline: false
            }
        );

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

        if (input.startsWith("calc ")) {
            return handleCalc(message, input);
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
