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
          { name: "Squads and KOG", value: "SQUAD_KOG" },
          { name: "ALL", value: "ALL" }
        )
    )
    .addAttachmentOption(option =>
      option.setName("image").setDescription("Image evidence").setRequired(false)
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

      const banningUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const image = interaction.options.getAttachment("image");
      const appealableAfter = interaction.options.getString("appealable_after");
      const banScope = interaction.options.getString("ban_scope");

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

      // Calculate appeal timestamp if applicable
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

      const guildIds = {
        KIAD: ["1078478406745866271"],
        Squadrons: ["1313768451768188948"],
        KOG: ["857445688932696104"],
        SQUAD_KOG: ["1313768451768188948", "857445688932696104"],
        ALL: [
          "1078478406745866271", 
          "1313768451768188948", 
          "857445688932696104"
        ]
      };

      const guildsToBan = guildIds[banScope] || [];

      let scopeDescription;
      switch (banScope) {
        case "ALL": scopeDescription = "Kleiner Oil Group and all of its respective servers"; break;
        case "SQUAD_KOG": scopeDescription = "KOG Squadrons and Kleiner Oil Group"; break;
        default: scopeDescription = banScope; break;
      }

      const dmEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("You Have Been Banned")
        .setDescription(`You have been banned from the following scope: ${scopeDescription}.\n${formattedAppealMessage}`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();


      await banningUser.send({ embeds: [dmEmbed] }).catch(() => {
        console.warn(`Could not DM ${banningUser.tag}`);
      });

    
      for (const guildId of guildsToBan) {
        try {
          const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
          if (!guild) continue;

          await guild.members.ban(banningUser.id, { reason }).catch((err) => {
            console.warn(`Failed to ban ${banningUser.id} in guild ${guildId}`, err.message);
          });
        } catch (err) {
          console.error(`Ban error in guild ${guildId}:`, err);
        }
      }

      const logEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("🚨 | Member Banned | 🚨")
        .setDescription(
          `A member has been banned in the following scope: **${scopeDescription}**\n\n**User:** <@${banningUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>\n**Appealable After:** ${appealableAfter}`
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
        .addFields({ name: "Scope", value: scopeDescription }, { name: "Reason", value: reason })
        .setTimestamp();

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (err) {
      console.error("Ban Command Error:", err);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Error")
          .setDescription("An unexpected error occurred while executing the command.")
          .setTimestamp()],
        ephemeral: true
      });
    }
  }
};
