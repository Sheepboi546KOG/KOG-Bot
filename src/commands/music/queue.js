const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Displays the current music queue'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: 'There is nothing in the queue.', ephemeral: true });
    }

    const current = queue.songs[0];
    const upcoming = queue.songs.slice(1, 10).map((song, index) =>
      `${index + 1}. ${song.name} - \`${song.formattedDuration}\``
    ).join('\n') || 'No other songs in queue.';

    interaction.reply({
      embeds: [{
        title: `🎶 Now Playing: ${current.name}`,
        description: upcoming,
        color: 0x1DB954
      }]
    });
  }
};
