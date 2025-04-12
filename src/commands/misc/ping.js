const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  
  async execute(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    let description;

    if (ping < 100) {
      description = `Ping: ${ping}ms - That's faster than the time it takes for a hummingbird to flap its wings once!`;
    } else if (ping < 200) {
      description = `Ping: ${ping}ms - That's about the time it takes for a human to blink!`;
    } else if (ping < 300) {
      description = `Ping: ${ping}ms - Comparable to the reaction time of an average human!`;
    } else if (ping < 1000) {
      description = `Ping: ${ping}ms - That's slower than the time it takes for a sneeze to travel out of your mouth!`;
    } else {
      description = `Ping: ${ping}ms - Bad connection, slower than the time it takes for a sloth to move a few inches.`;
    } // i got skibidi with this (thanks chatgpt for the inspo)

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor("Blue")
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'KOG Bot', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },
};
