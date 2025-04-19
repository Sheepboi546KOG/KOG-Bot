const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
          { name: "1 Month", value: "1 Months" },
          { name: "6 Months", value: "6 Months" },
          { name: "1 Year", value: "1 Year" },
          { name: "No Appeal", value: "No Appeal" }
        )
    )
    .addAttachmentOption(option =>
      option.setName("image").setDescription("Image evidence").setRequired(false)
    ),
    

  async execute(interaction) {
    try {
      const hrRole = "917829003660910633";
      const member = interaction.guild.members.cache.get(interaction.user.id);

      

      const banningUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const image = interaction.options.getAttachment("image");
      const appealableAfter = interaction.options.getString("appealable_after");

      

      const memberToBan = await interaction.guild.members.fetch(banningUser.id);

    if (!member.roles.cache.has(hrRole)) {
        const noPermissionEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
        return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
    }


    if (banningUser.id === interaction.user.id) {
        const selfBanEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban yourself.")
            .setTimestamp();
        return interaction.reply({ embeds: [selfBanEmbed], ephemeral: true });
    }

    if (banningUser.bot) {
        const botBanEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban a bot.")
            .setTimestamp();
        return interaction.reply({ embeds: [botBanEmbed], ephemeral: true });
    }

 
    if (memberToBan.roles.highest.position >= member.roles.highest.position) {
        const roleHierarchyEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Action Denied")
            .setDescription("You cannot ban a user with a higher or equal role.")
            .setTimestamp();
        return interaction.reply({ embeds: [roleHierarchyEmbed], ephemeral: true });
    }

      await memberToBan.ban({ reason });


    let appealTimestamp = null;
    if (appealableAfter !== "No Appeal") {
      const now = new Date();
      switch (appealableAfter) {
        case "1 Day":
          appealTimestamp = new Date(now.setDate(now.getDate() + 1));
          break;
        case "1 Week":
          appealTimestamp = new Date(now.setDate(now.getDate() + 7));
          break;
        case "2 Weeks":
          appealTimestamp = new Date(now.setDate(now.getDate() + 14));
          break;
        case "1 Month":
          appealTimestamp = new Date(now.setMonth(now.getMonth() + 1));
          break;
        case "6 Months":
          appealTimestamp = new Date(now.setMonth(now.getMonth() + 6));
          break;
        case "1 Year":
          appealTimestamp = new Date(now.setFullYear(now.getFullYear() + 1));
          break;
      }
    }

    const formattedAppealMessage =
      appealableAfter === "No Appeal"
        ? "This ban is Not Appealable"
        : `This ban is ${appealableAfter} long and can be appealed after <t:${Math.floor(appealTimestamp.getTime() / 1000)}:F> in KIAD. Found [here](https://discord.gg/kQQfcg3k).`;

    const dmEmbed = new EmbedBuilder()
      .setColor("#e44144")
      .setTitle("Ban Notification")
      .setDescription(`You have been banned from Kleiner Oil Group.\n${formattedAppealMessage}`)
      .addFields({ name: "Reason", value: reason })
      .setTimestamp();

   

    const targetUser = await interaction.client.users.fetch(banningUser.id);

    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
      console.error(`Failed to send DM to user with ID ${banningUser.id}`);
    });

    

    console.log(`DM sent to user with ID ${targetUserId}`);
 


      const logEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("🚨 | Member Banned | 🚨")
        .setDescription(
          `A member has been issued a ban in KOG.\n\n**User:** <@${banningUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>\n**Appealable After:** ${appealableAfter}`
        )
        .setTimestamp();

      if (image) logEmbed.setImage(image.url);

      const IAWEBHOOK = process.env.IAWEBHOOK;
      if (IAWEBHOOK) {
        axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        }).catch(err => console.error("Webhook error:", err));
      }

      const successEmbed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Ban Successful")
        .setDescription(`Successfully banned <@${banningUser.id}>.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      return interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error("Error in ban command:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription("An error occurred while executing the command.")
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
