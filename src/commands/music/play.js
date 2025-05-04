const { SlashCommandBuilder } = require('discord.js');
process.env.FFMPEG_PATH = require('ffmpeg-static');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from a URL or search query')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The song URL or search term')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;
    const client = interaction.client;

    if (!voiceChannel) {
      return interaction.reply({ content: 'You need to be in a voice channel to play music.', ephemeral: true });
    }

    try {
      await interaction.reply({ content: `🔍 Searching for: \`${query}\`` });

      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });

    } catch (err) {
      console.error(err);
      interaction.followUp({ content: '❌ Failed to play the song.', ephemeral: true });
    }
  }
};
