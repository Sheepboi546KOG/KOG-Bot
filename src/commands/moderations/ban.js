const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();
const adminSchema = require("../../schemas/admin");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user.")
    .addUserOption(option =>
      option.setName("user").setDescription("User to ban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the ban").setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("appealable_after")
        .setDescription("Appeal duration")
        .setRequired(true)
        .addChoices(
          { name: "1 Day", value: "1 Day" },
          { name: "1 Week", value: "1 Week" },
          { name: "2 Weeks", value: "2 Weeks" },
          { name: "1 Month", value: "1 Month" },
          { name: "6 Months", value: "6 Months" },
          { name: "1 Year", value: "1 Year" },
          { name: "No Appeal", value: "No Appeal" }
        )
    )
    .addStringOption(option =>
      option
        .setName("ban_scope")
        .setDescription("Scope of the ban")
        .setRequired(true)
        .addChoices(
          { name: "KIAD", value: "KIAD" },
          { name: "KOG", value: "KOG" },
          { name: "Squadrons", value: "Squadrons" },
          { name: "ALL", value: "ALL" }
        )
    )
    .addAttachmentOption(option =>
      option.setName("image").setDescription("Image evidence").setRequired(false)
    ),

  dev: true,

  async execute(interaction) {
    try {
      const hasPermission = await adminSchema.findOne({ userId: interaction.user.id });
      const banningUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const image = interaction.options.getAttachment("image");
      const appealableAfter = interaction.options.getString("appealable_after");
      const banScope = interaction.options.getString("ban_scope");

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

      if (interaction.user.id === banningUser.id) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban yourself.")
            .setTimestamp()],
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(banningUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Action Denied")
        .setDescription("The specified user is not a member of this server.")
        .setTimestamp()],
          ephemeral: true
        });
      }

      if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Action Denied")
        .setDescription("You cannot ban a user with an equal or higher role.")
        .setTimestamp()],
          ephemeral: true
        });
      }

      const guildIds = {
        KIAD: ["1078478406745866271"],
        Squadrons: ["1313768451768188948"],
        KOG: ["857445688932696104"],
        ALL: [
          "1078478406745866271", 
          "1313768451768188948", 
          "857445688932696104"
        ]
      };

      const guildsToBan = guildIds[banScope] || [];

      let appealTimestamp = null;
      if (appealableAfter !== "No Appeal") {
        const now = new Date();
        switch (appealableAfter) {
          case "1 Day": now.setDate(now.getDate() + 1); break;
          case "1 Week": now.setDate(now.getDate() + 7); break;
          case "2 Weeks": now.setDate(now.getDate() + 14); break;
          case "1 Month": now.setMonth(now.getMonth() + 1); break;
          case "6 Months": now.setMonth(now.getMonth() + 6); break;
          case "1 Year": now.setFullYear(now.getFullYear() + 1); break;
        }
        appealTimestamp = now;
      }

      const formattedAppealMessage =
        appealableAfter === "No Appeal"
          ? "This ban is not appealable."
          : `This ban is ${appealableAfter} long and can be appealed after <t:${Math.floor(appealTimestamp.getTime() / 1000)}:F> in KIAD. Found [here](https://discord.gg/kQQfcg3k).`;

      const dmEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("You Have Been Banned")
        .setDescription(
          banScope === "ALL"
          ? `You have been banned from Kleiner Oil Group and all of its respective servers.\n${formattedAppealMessage}`
          : `You have been banned from the following scope: ${banScope}.\n${formattedAppealMessage}`
        )
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      // Try DM user
      await banningUser.send({ embeds: [dmEmbed] }).catch(() => {
        console.warn(`Could not DM ${banningUser.tag}`);
      });

      // Ban in all specified guilds
      for (const guildId of guildsToBan) {
        try {
          const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
          if (!guild) continue;

          const memberToBan = await guild.members.fetch(banningUser.id).catch(() => null);
          if (!memberToBan) continue;

          await memberToBan.ban({ reason });
          console.log(`Successfully banned user ${banningUser.id} in guild ${guildId}`);
        } catch (error) {
          console.error(`Failed to ban user ${banningUser.id} in guild ${guildId}:`, error);
          continue;
        }
      }

      // Log webhook
      const logEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("🚨 | Member Banned | 🚨")
        .setDescription(
          `A member has been banned in the following scope: **${banScope}**\n\n**User:** <@${banningUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>\n**Appealable After:** ${appealableAfter}`
        )
        .setTimestamp();

      if (image) logEmbed.setImage(image.url);

      const IAWEBHOOK = process.env.IAWEBHOOK;
      if (IAWEBHOOK) {
        await axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        }).catch(console.error);
      }

      const successEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Ban Executed")
        .setDescription(`Successfully banned <@${banningUser.id}>.`)
        .addFields({ name: "Scope", value: banScope }, { name: "Reason", value: reason })
        .setTimestamp();

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error("Error in ban command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription("An unexpected error occurred while executing the command.")
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
