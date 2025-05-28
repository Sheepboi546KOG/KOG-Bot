const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const MyData = require('../../schemas/mydata');

const mrId = '11934148804982867033';
const hrId = '9178290036609106333';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mydata')
        .setDescription('Check your events and merits stats.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Select a user to view their data')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
   
            const targetUser = interaction.options.getUser('user') || interaction.user;
            if (targetUser.id !== interaction.user.id) {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const hasPermission = member.roles.cache.some(role =>
                    [mrId, hrId].includes(role.id)
                );
                if (!hasPermission) {
                    const embed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle("Permission Denied")
                        .setDescription("❌ You do not have permission to view other users' data.")
                        .setFooter({ text: `Requested by ${interaction.user.tag}` })
                        .setTimestamp();
                    return await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
            }

            let data = await MyData.findOne({ userId: targetUser.id });

            if (!data) {
                const newEmbed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("No Data Found")
                    .setDescription(`${targetUser.id === interaction.user.id ? "You have" : `${targetUser.tag} has`} not participated in any events yet.`)
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();
                return await interaction.reply({ embeds: [newEmbed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.Purple)
                .setTitle(`${targetUser.id === interaction.user.id ? "Your" : `${targetUser.username}'s`} Event Stats`)
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
                content: "❌ An error occurred while retrieving the data.",
                ephemeral: true
            });
        }
    }
};
