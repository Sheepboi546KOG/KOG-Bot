const { EmbedBuilder, Colors } = require("discord.js");
const Event = require('../schemas/eventSchema'); 
const { v4: uuidv4 } = require('uuid');

module.exports = {
    customId: 'eventScheduling',

    async execute(interaction) {
        const Host = interaction.fields.getTextInputValue('host');
        const Type = interaction.fields.getTextInputValue('type');
        const unix = interaction.fields.getTextInputValue('unix');
        const game = interaction.fields.getTextInputValue('game');
        const note = interaction.fields.getTextInputValue('note') || 'No additional notes';


        const uuid = uuidv4();

        try {
            await Event.create({
                uuid,
                host: Host,
            });
        } catch (err) {
            console.error('Error saving event to MongoDB:', err);
            return interaction.reply({
                content: '❌ Failed to schedule the event. Please try again later.',
                ephemeral: true
            });
        }

        const channel = interaction.client.channels.cache.get('1346226339010838528');
        if (!channel) {
            return interaction.reply({
                content: '❌ Announcement channel not found.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#e47c24")
            .setTitle('New Event Scheduled!')
            .setDescription(`A new event has been scheduled by **<@${interaction.user.id}>**!\n\nHost: ${Host}\nDate: <t:${unix}:F>\nGame: ${game}\nType: ${Type}\n\nNotes: ${note}\n\nPlease confirm your reaction with the ✅ below.`)
            .setTimestamp();

        const message = await channel.send({ embeds: [embed] });
        await message.react('✅');

        await interaction.user.send(`✅ Your event has been scheduled!\n**UUID:** \`${uuid}\`\n**Time:** <t:${unix}:F>\nYou’ll need this UUID to cancel, postpone, start, or conclude the event.`);

        await interaction.reply({ content: '✅ Event scheduled and announced!', ephemeral: true });
    }
};
