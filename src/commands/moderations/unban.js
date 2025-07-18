const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();
const adminSchema = require("../../schemas/admin");
const banSchema = require("../../schemas/bans");

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
          { name: "KIAD", value: "KIAD" },
          { name: "KOG", value: "KOG" },
          { name: "Squadrons", value: "Squadrons" },
          { name: "ALL", value: "ALL" }
        )
    ),

  async execute(interaction) {
    try {
      const hasPermission = await adminSchema.findOne({ userId: interaction.user.id });

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

      const guildIds = {
        KIAD: "1078478406745866271",
        KOG: "857445688932696104",
        Squadrons: "1313768451768188948"
      };

      const guildsToUnban = unbanScope === "ALL"
        ? Object.values(guildIds)
        : [guildIds[unbanScope]];

      let unbannedFrom = [];

      for (const guildId of guildsToUnban) {
        const guild = interaction.client.guilds.cache.get(guildId);
        if (guild) {
          try {
            await guild.members.unban(userId, reason);
            unbannedFrom.push(guild.name);
          } catch (error) {
            if (error.code === 10026) { // Unknown Ban error
              console.log(`User is not banned in guild ${guild.name}. Skipping.`);
              continue;
            } else {
              console.error(`Error unbanning user from guild ${guild.name}:`, error);
              continue;
            }
          }
        }
      }

      if (unbannedFrom.length === 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unban Failed")
            .setDescription("The user was not banned in any of the selected scopes.")
            .setTimestamp()],
          ephemeral: true
        });
      }


      if (unbanScope === "KOG" || unbanScope === "ALL") {
        await banSchema.updateMany(
          { userId, active: true },
          { $set: { active: false } }
        );
      }

      const logEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("🚨 | Member Unbanned | 🚨")
        .setDescription(
          `A member has been unbanned.\n\n**User ID:** <@${userId}>\n**Reason:** ${reason}\n**Scopes Unbanned:** ${unbannedFrom.join(", ")}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      const IAWEBHOOK = process.env.IAWEBHOOK;
      if (IAWEBHOOK) {
        try {
          await axios.post(IAWEBHOOK, { embeds: [logEmbed.toJSON()] });
        } catch (error) {
          console.error("Error sending webhook:", error);
        }
      }

      const successEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Unban Executed")
        .setDescription(`Successfully unbanned the user with ID **${userId}** from: **${unbannedFrom.join(", ")}**.`)
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
