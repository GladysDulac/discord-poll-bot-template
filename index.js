import express from 'express';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } from 'discord.js';
import cron from 'node-cron';
import fs from 'fs';
import config from './config.json' assert { type: 'json' };
import './keepalive.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

let votes = { mercredi: {}, vendredi: {} };
if (fs.existsSync('./votes.json')) {
  votes = JSON.parse(fs.readFileSync('./votes.json'));
}

function saveVotes() {
  fs.writeFileSync('./votes.json', JSON.stringify(votes, null, 2));
}

function createPollEmbed(day) {
  const voteCounts = { oui: 0, non: 0 };
  for (const vote of Object.values(votes[day])) {
    if (vote === 'oui') voteCounts.oui++;
    else if (vote === 'non') voteCounts.non++;
  }
  return new EmbedBuilder()
    .setTitle(`Présence à l'entraînement de ${day.toUpperCase()}`)
    .setDescription(`✅ OUI : ${voteCounts.oui}\n❌ NON : ${voteCounts.non}`)
    .setColor(day === 'mercredi' ? 0x00b0f4 : 0x00f457)
    .setTimestamp();
}

function createPollButtons(day) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${day}_oui`)
      .setLabel('✅ OUI')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${day}_non`)
      .setLabel('❌ NON')
      .setStyle(ButtonStyle.Danger)
  );
}

async function sendWeeklyPoll() {
  votes = { mercredi: {}, vendredi: {} };
  saveVotes();
  const channel = await client.channels.fetch(config.channelId);
  if (!channel) return;
  await channel.send(`<@&${config.roleId}>`);
  await channel.send({ embeds: [createPollEmbed('mercredi')], components: [createPollButtons('mercredi')] });
  await channel.send({ embeds: [createPollEmbed('vendredi')], components: [createPollButtons('vendredi')] });
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const [day, answer] = interaction.customId.split('_');
  votes[day][interaction.user.id] = answer;
  saveVotes();
  await interaction.update({ embeds: [createPollEmbed(day)], components: [createPollButtons(day)] });
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  // Envoi immédiat du sondage pour test
  sendWeeklyPoll();

  // Puis la planification hebdo normale
  cron.schedule('0 6 * * 1', sendWeeklyPoll); // Lundi 7h heure France (6h UTC)
});

client.login(config.token);

