require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Events,
  InteractionType,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = '1402222445901119558'; // Rôle à ping pour les sondages

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Stockage des votes
const votes = {
  mercredi: new Map(),
  vendredi: new Map(),
};

// Boutons pour sondage
const createButtons = (jour) => new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId(`${jour}_oui`)
      .setLabel('✅ OUI')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${jour}_non`)
      .setLabel('❌ NON')
      .setStyle(ButtonStyle.Danger)
  );

// Embed sondage
const createEmbed = (jour) =>
  new EmbedBuilder()
    .setTitle(`📅 Présence à l'entraînement de ${jour.toUpperCase()}`)
    .setDescription('Cliquez sur un bouton pour répondre.')
    .setColor(0x00AE86)
    .setTimestamp();

// Envoyer sondages
async function sendPolls(channel) {
  await channel.send(`<@&${ROLE_ID}>`);
  await channel.send({
    embeds: [createEmbed('mercredi')],
    components: [createButtons('mercredi')],
  });

  await channel.send(`<@&${ROLE_ID}>`);
  await channel.send({
    embeds: [createEmbed('vendredi')],
    components: [createButtons('vendredi')],
  });
}

// Gérer clics boutons
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [jour, reponse] = interaction.customId.split('_');
  votes[jour].set(interaction.user.id, reponse.toUpperCase());

  await interaction.reply({
    content: `Ta réponse pour **${jour.toUpperCase()}** a été enregistrée : **${reponse.toUpperCase()}** ✅`,
    ephemeral: true
  });
});

// Commande /résultats avec contrôle des rôles
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (interaction.commandName !== 'résultats') return;

  // Rôles autorisés à voir les résultats
  const ROLES_AUTORISES = [
    '1402257000858910790',
    '1402219622459248742',
    '1402221368392810588'
  ];

  const member = interaction.member; // GuildMember

  // Vérifie si le membre a au moins un rôle autorisé
  const hasRole = member.roles.cache.some(role => ROLES_AUTORISES.includes(role.id));

  if (!hasRole) {
    return interaction.reply({
      content: "❌ Tu n'as pas la permission de voir les résultats.",
      ephemeral: true,
    });
  }

// Construire les embeds résultats
const buildResultEmbed = async (jour) => {
  const ouiUsers = [];
  const nonUsers = [];

  for (const [userId, vote] of votes[jour]) {
    try {
      const user = await client.users.fetch(userId);
      if (vote === 'oui') {
        ouiUsers.push(user.username);
      } else if (vote === 'non') {
        nonUsers.push(user.username);
      }
    } catch (err) {
      console.error(`Impossible de récupérer l'utilisateur ${userId}:`, err);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`Résultats du sondage ${jour}`)
    .setColor(0x00AE86)
    .addFields(
      { name: '✅ Oui', value: ouiUsers.length ? ouiUsers.join('\n') : 'Aucun', inline: true },
      { name: '❌ Non', value: nonUsers.length ? nonUsers.join('\n') : 'Aucun', inline: true }
    )
    .setTimestamp();

  return embed;
};
