require('dotenv').config(); // pour lecture du .env si en local

const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Events } = require('discord.js');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
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
  // MERCREDI
  await channel.send(`<@&${ROLE_ID}>`);
  await channel.send({
    embeds: [createEmbed('mercredi')],
    components: [createButtons('mercredi')],
  });

  // VENDREDI
  await channel.send(`<@&${ROLE_ID}>`);
  await channel.send({
    embeds: [createEmbed('vendredi')],
    components: [createButtons('vendredi')],
  });
}

// Gestion des clics
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [jour, reponse] = interaction.customId.split('_');

  votes[jour].set(interaction.user.id, reponse.toUpperCase());

  await interaction.reply({
    content: `Ta réponse pour **${jour.toUpperCase()}** a été enregistrée : **${reponse.toUpperCase()}**`,
    ephemeral: true,
  });
});

// Quand le bot est prêt
client.once(Events.ClientReady, async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.find(c => c.isTextBased() && c.viewable);

  if (!channel) {
    console.error('Aucun canal texte trouvé pour envoyer les sondages.');
    return;
  }

  // 🧪 Envoi immédiat pour test
  await sendPolls(channel);

  // ⏰ Programmation chaque lundi à 07h00
  cron.schedule('0 7 * * 1', async () => {
    await sendPolls(channel);
  }, {
    timezone: 'Europe/Paris'
  });
});

// Lancer le bot
client.login(TOKEN);


