const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const MyData = require('../../schemas/mydata.js');

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
                const newUserData = new MyData({
                    userId: user.id,
                    eventsAttended: 0,
                    eventsHosted: 0,
                    merits: 0,
                });

                newUserData[field] = value;
                await newUserData.save();
            } else {
                if (field === "eventsAttended") {
                    userData.eventsAttended += value;
                } else if (field === "eventsHosted") {
                    userData.eventsHosted += value;
                } else if (field === "merits") {
                    userData.merits += value;
                } else {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setTitle("Invalid Field")
                            .setDescription("The specified field is not valid.")
                            .setColor(Colors.Red)],
                        ephemeral: true,
                    });
                }

     
                await userData.save();
            }

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
