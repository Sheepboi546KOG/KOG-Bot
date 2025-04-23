const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();
const modSchema = require("../../schemas/mods"); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user.")
    .addStringOption(option =>
      option.setName("user_id").setDescription("ID of the user to unban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the unban").setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("unban_scope")
        .setDescription("Scope of the unban")
        .setRequired(true)
        .addChoices(
          { name: "KIAD", value: "Kleiner Internal Affairs Department" },
          { name: "KOG", value: "Kleiner Oil Group" },
          { name: "Squadrons", value: "[KOG] Squadrons" },
          { name: "ALL", value: "ALL" }
        )
    ),

  async execute(interaction) {
    try {
      
      const member = interaction.member;
      const hasPermission = await modSchema.findOne({ userId: interaction.user.id });

      if (!hasPermission) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp()],
          ephemeral: true
        });
      }

      const userId = interaction.options.getString("user_id");
      const reason = interaction.options.getString("reason");
      const unbanScope = interaction.options.getString("unban_scope");

      // Attempt to unban the user
      try {
        await interaction.guild.members.unban(userId, reason);
      } catch (error) {
        console.error("Error unbanning user:", error);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unban Failed")
            .setDescription("Unable to unban the specified user. They may not be banned.")
            .setTimestamp()],
          ephemeral: true
        });
      }

      // Notify the user via DM
      const unbannedUser = await interaction.client.users.fetch(userId).catch(() => null);
      if (unbannedUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("You Have Been Unbanned")
          .setDescription(
            unbanScope === "ALL"
              ? "You have been unbanned from Kleiner Oil Group and all of its respective servers. You can rejoin here: [KOG](https://discord.gg/HvtsjFvh)"
              : `You have been unbanned from the following scope: ${unbanScope}.`
          )
          .addFields({ name: "Reason", value: reason })
          .setTimestamp();

        await unbannedUser.send({ embeds: [dmEmbed] }).catch(() => {
          console.warn(`Could not DM user with ID ${userId}`);
        });
      }

      // Log the unban action
      const logEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("🚨 | Member Unbanned | 🚨")
        .setDescription(
          `A member has been unbanned in the following scope: **${unbanScope}**\n\n**User ID:** ${userId}\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      const IAWEBHOOK = process.env.IAWEBHOOK;
      if (IAWEBHOOK) {
        await axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        }).catch(console.error);
      }

      // Reply to the moderator
      const successEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Unban Executed")
        .setDescription(`Successfully unbanned the user with ID ${userId} from the scope: **${unbanScope}** and logged the action.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error("Error in unban command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription("An unexpected error occurred while executing the command.")
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
