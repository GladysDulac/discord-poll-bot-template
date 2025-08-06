require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  Events, 
  InteractionResponseFlags 
} = require('discord.js');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID; // ID du canal texte pour les sondages
const ROLE_ID = '1402222445901119558'; // Ton rôle à ping

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Stockage des votes
const votes = {
  mercredi: new Map(),
  vendredi: new Map(),
};

// Créer les boutons
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

// Créer l'embed
const createEmbed = (jour) => {
  const embed = new EmbedBuilder()
    .setTitle(`📅 Présence à l'entraînement de ${jour.toUpperCase()}`)
    .setDescription('Cliquez sur un bouton pour répondre.')
    .setColor(0x00AE86)
    .setTimestamp();

  return embed;
};

// Envoyer les sondages
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

// Gestion des clics avec mise à jour du message pour éviter l'échec
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [jour, reponse] = interaction.customId.split('_');

  votes[jour].set(interaction.user.id, reponse.toUpperCase());

  try {
    await interaction.update({
      content: `✅ Ton vote pour **${jour.toUpperCase()}** a été enregistré : **${reponse.toUpperCase()}**`,
      components: [createButtons(jour)],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l’interaction:', error);
  }
});

// Gestion des erreurs
client.on('error', error => {
  console.error('Erreur client Discord:', error);
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.get(CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    console.error('Le canal texte spécifié est introuvable ou invalide.');
    return;
  }

  // Envoi immédiat pour test
  await sendPolls(channel);

  // Programmation chaque lundi à 07h00
  cron.schedule('0 7 * * 1', async () => {
    await sendPolls(channel);
  }, {
    timezone: 'Europe/Paris'
  });
});

client.login(TOKEN);

