const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music and clears the queue'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
    }

    try {
      queue.stop();
      interaction.reply({ content: '⏹️ Stopped playback and cleared the queue.' });
    } catch (err) {
      console.error(err);
      interaction.reply({ content: 'Could not stop the music.', ephemeral: true });
    }
  }
};
