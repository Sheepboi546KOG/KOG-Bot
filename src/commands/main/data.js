const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const MyData = require('../../schemas/mydata');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dataupdate")
        .setDescription("Update a user's event data (eventsAttended, eventsHosted, merits).")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("User to update")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("field")
                .setDescription("Field to update")
                .setRequired(true)
                .addChoices(
                    { name: "Events Attended", value: "eventsAttended" },
                    { name: "Events Hosted", value: "eventsHosted" },
                    { name: "Merits", value: "merits" }
                ))
        .addIntegerOption(option => 
            option.setName("value")
                .setDescription("New value for the field")
                .setRequired(true)),

    async execute(interaction) {
        try {
            const mrId = '1193414880498286703';
            const hrId = '917829003660910633';
            const memberRoles = interaction.member.roles.cache;
            
            if (!memberRoles.has(mrId) && !memberRoles.has(hrId)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle("No Permission")
                        .setDescription("You do not have permission to use this command.")
                        .setColor(Colors.Red)],
                    ephemeral: true,
                });
            }

            const user = interaction.options.getUser('user');
            const field = interaction.options.getString('field');
            const value = interaction.options.getInteger('value');
            
            const userData = await MyData.findOne({ userId: user.id });

            if (!userData) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle("User Not Found")
                        .setDescription(`No data found for the user <@${user.id}>.`)
                        .setColor(Colors.Red)],
                    ephemeral: true,
                });
            }

            userData[field] = value;
            await userData.save();

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle("Data Updated")
                    .setDescription(`Successfully updated **${field}** for <@${user.id}> to **${value}**.`)
                    .setColor(Colors.Green)],
                ephemeral: true,
            });

        } catch (err) {
            console.error('Error in /dataupdate:', err);
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription("An unexpected error occurred. Please try again later.")
                    .setColor(Colors.Red)],
                ephemeral: true,
            });
        }
    }
};
