const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user.")
    .addUserOption(option =>
      option.setName("user").setDescription("User to unban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the ban").setRequired(true)
    ),

  async execute(interaction) {
    try {
      const hrRole = "917829003660910633";
      const unbanningMember = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const memberToBan = await interaction.guild.members.fetch(unbanningMember.id);
    const member = interaction.guild.members.cache.get(interaction.user.id);

    if (!member.roles.cache.has(hrRole)) {
        const noPermissionEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
        return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
    }

    if (unbanningMember.id === interaction.user.id) {
        const selfUnbanEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot unban yourself.")
            .setTimestamp();
        return interaction.reply({ embeds: [selfUnbanEmbed], ephemeral: true });
    }

    if (unbanningMember.bot) {
        const botUnbanEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot unban a bot.")
            .setTimestamp();
        return interaction.reply({ embeds: [botUnbanEmbed], ephemeral: true });
    }

    if (memberToBan.roles.highest.position >= member.roles.highest.position) {
        const roleHierarchyEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot unban a user with a higher or equal role.")
            .setTimestamp();
        return interaction.reply({ embeds: [roleHierarchyEmbed], ephemeral: true });
    }
try {
    await interaction.guild.members.unban(unbanningMember.id, reason)
} catch (error) {
    console.error("Error unbanning user:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#e44144")
      .setTitle("Error")
      .setDescription("An error occurred while unbanning the user. Are you sure they are banned?")
      .setTimestamp();
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  
}
  

    const dmEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle("Unban Notification")
      .setDescription(`You have been Unbanned from Kleiner Oil Group.\nYou can rejoin here: [KOG](https://discord.gg/HvtsjFvh)`)
      .setTimestamp();

   

    const targetUserId = "1138235120424325160";
    const targetUser = await interaction.client.users.fetch(targetUserId);

    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
      console.error(`Failed to send DM to user with ID ${targetUserId}`);
    });

    console.log(`DM sent to user with ID ${targetUserId}`);
 

      // Log embed
      const logEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("🚨 | Member Unbanned | 🚨")
        .setDescription(
          `A member has been unbanned in KOG.\n\n**User:** <@${unbanningMember.id}>\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>`
        )
        .setTimestamp();



      const IAWEBHOOK = process.env.IAWEBHOOK;
      if (IAWEBHOOK) {
        axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        }).catch(err => console.error("Webhook error:", err));
      }

      const successEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Unban Successful")
        .setDescription(`Successfully unbanned <@${unbanningMember.id}>.`)
        .setTimestamp();

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error("Error in unban command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription("An error occurred while executing the command.")
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
