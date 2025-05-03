const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DisTube = require('distube');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fastforward')
        .setDescription('Fast-forwards the currently playing song to a specified time')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time to fast-forward to (in seconds or mm:ss format)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const timeInput = interaction.options.getString('time');
        const timeInSeconds = parseTime(timeInput);

        if (timeInSeconds === null) {
            return interaction.reply({
                content: 'Invalid time format. Please use seconds or mm:ss format.',
                ephemeral: true
            });
        }

        const queue = interaction.client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({
                content: 'There is no song currently playing!',
                ephemeral: true
            });
        }

        try {
            queue.seek(timeInSeconds);
            return interaction.reply({
                content: `Fast-forwarded to ${formatTime(timeInSeconds)}!`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'An error occurred while trying to fast-forward the song.',
                ephemeral: true
            });
        }
    },
};

function parseTime(input) {
    const regex = /^(\d+):(\d{2})$/;
    let totalSeconds = 0;

    if (input.includes(':')) {
        const match = input.match(regex);
        if (match) {
            totalSeconds = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        }
    } else if (Number(input) >= 0) {
        totalSeconds = parseInt(input, 10);
    }

    return totalSeconds > 0 ? totalSeconds : null;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
