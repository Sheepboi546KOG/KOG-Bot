const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

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
          { name: "KIAD", value: "Kleiner Internal Affairs Department" },
          { name: "KOG", value: "Kleiner Oil Group" },
          { name: "Squadrons", value: "[KOG] Squadrons" },
          { name: "ALL", value: "ALL" }
        )
    )
    .addAttachmentOption(option =>
      option.setName("image").setDescription("Image evidence").setRequired(false)
    ),

  dev: true,

  async execute(interaction) {
    try {
      const ALLOWED_ROLE_IDS = [
        "917829003660910633",      // KOG HR
        "1360275881343324404",     // Internal Affairs Squadrons
        "1313994079662641233"      // KOG Command Squadrons

        // tyler needs to approve this though
      ];

      const member = interaction.member;
      const hasPermission = member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

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

      const banningUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const image = interaction.options.getAttachment("image");
      const appealableAfter = interaction.options.getString("appealable_after");
      const banScope = interaction.options.getString("ban_scope");

      const memberToBan = await interaction.guild.members.fetch(banningUser.id).catch(() => null);

      if (banningUser.id === interaction.user.id) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban yourself.")
            .setTimestamp()],
          ephemeral: true
        });
      }

      if (banningUser.bot) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban a bot.")
            .setTimestamp()],
          ephemeral: true
        });
      }

      if (
        memberToBan &&
        memberToBan.roles.highest.position >= member.roles.highest.position
      ) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban a user with a higher or equal role.")
            .setTimestamp()],
          ephemeral: true
        });
      }

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

      await banningUser.send({ embeds: [dmEmbed] }).catch(() => {
        console.warn(`Could not DM ${banningUser.tag}`);
      });

      await interaction.guild.members.ban(banningUser.id, {
        reason: `${reason} | Issued by ${interaction.user.tag}`
      }).catch((err) => {
        console.error("Ban failed:", err);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Ban Failed")
            .setDescription("Unable to ban the specified user. They may have already left or I lack permissions.")
            .setTimestamp()],
          ephemeral: true
        });
      });

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
        .setDescription(`Successfully banned <@${banningUser.id}> and logged the action.`)
        .addFields({ name: "Reason", value: reason })
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
