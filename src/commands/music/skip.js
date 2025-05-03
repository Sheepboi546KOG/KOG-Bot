const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the currently playing song'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: 'There is nothing playing.', ephemeral: true });
    }

    try {
      await queue.skip();
      interaction.reply({ content: '⏭️ Skipped the song!' });
    } catch (err) {
      console.error(err);
      interaction.reply({ content: 'Failed to skip the song.', ephemeral: true });
    }
  }
};
