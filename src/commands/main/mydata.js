const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const MyData = require('../../schemas/mydata'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mydata')
        .setDescription('Check your events and merits stats.'),
    
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            let data = await MyData.findOne({ userId });

            if (!data) {
                const newEmbed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("No Data Found")
                    .setDescription("You have not participated in any events yet.")
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();
                return await interaction.reply({ embeds: [newEmbed], ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(Colors.Purple)
                .setTitle("Your Event Stats")
                .addFields(
                    { name: "Events Attended", value: `${data.eventsAttended}`, inline: true },
                    { name: "Events Hosted", value: `${data.eventsHosted}`, inline: true },
                    { name: "Merits", value: `${data.merits}`, inline: true }
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (err) {
            console.error("Error in /mydata:", err);
            await interaction.reply({
                content: "❌ An error occurred while retrieving your data.",
                ephemeral: true
            });
        }
    }
};
