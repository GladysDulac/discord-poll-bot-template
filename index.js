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
const ROLE_ID = '1402222445901119558';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Stockage des votes
const votes = {
  mercredi: new Map(),
  vendredi: new Map(),
};

// Boutons
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

// Gérer clics sur les boutons
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [jour, reponse] = interaction.customId.split('_');
  votes[jour].set(interaction.user.id, reponse.toUpperCase());

  await interaction.reply({
    content: `Ta réponse pour **${jour.toUpperCase()}** a été enregistrée : **${reponse.toUpperCase()}** ✅`,
    ephemeral: true
  });
});

// Commande /résultats
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (interaction.commandName !== 'résultats') return;

  const buildResultEmbed = (jour) => {
    const totalOui = Array.from(votes[jour].values()).filter(v => v === 'OUI').length;
    const totalNon = Array.from(votes[jour].values()).filter(v => v === 'NON').length;

    return new EmbedBuilder()
      .setTitle(`📊 Résultats pour ${jour.toUpperCase()}`)
      .setColor(0x3498db)
      .addFields(
        { name: '✅ OUI', value: `${totalOui}`, inline: true },
        { name: '❌ NON', value: `${totalNon}`, inline: true },
      )
      .setTimestamp();
  };

  await interaction.reply({
    embeds: [buildResultEmbed('mercredi'), buildResultEmbed('vendredi')],
    ephemeral: true
  });
});

// Enregistrement commande /résultats
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('résultats')
      .setDescription("Afficher les résultats des sondages"),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('🔄 Enregistrement de la commande slash...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commande slash enregistrée.');
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de la commande slash :', error);
  }
}

// Prêt
client.once(Events.ClientReady, async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  await registerCommands();

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.get(CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    console.error('❌ Le canal texte spécifié est introuvable ou invalide.');
    return;
  }

  await sendPolls(channel);

  // Programmation chaque lundi à 07h00
  cron.schedule('0 7 * * 1', async () => {
    await sendPolls(channel);
  }, {
    timezone: 'Europe/Paris'
  });
});

client.login(TOKEN);

