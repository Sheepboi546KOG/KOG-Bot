const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const Warning = require("../../schemas/warn.js");
const axios = require('axios');
const modSchema = require("../../schemas/mods.js"); 
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage warnings.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("give")
        .setDescription("Give a warning to a user")
        .addUserOption(option => option.setName("user").setDescription("User to warn").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for the warning").setRequired(true))
        .addAttachmentOption(option => option.setName("image").setDescription("Image evidence").setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("check")
        .setDescription("Check all warnings for a user")
        .addUserOption(option => option.setName("user").setDescription("User to check warnings for").setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove a warning from a user")
        .addStringOption(option => option.setName("warningid").setDescription("ID of the warning to remove").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for warning removal").setRequired(true))),
  
  async execute(interaction) {
    try {
     
      const member = interaction.guild.members.cache.get(interaction.user.id);
      
    const haspermission = await modSchema.findOne({ userId: interaction.user.id });

    if (!haspermission) {
      const noPermissionEmbed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Permission Denied")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();
      return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
    }

  const targetUser = interaction.options.getUser("user");
  const targetMember = interaction.guild.members.cache.get(targetUser?.id);

  if (interaction.user.id === targetUser?.id) {
    const selfActionEmbed = new EmbedBuilder()
      .setColor("#e44144")
      .setTitle("Action Denied")
      .setDescription("You cannot perform this action on yourself.")
      .setTimestamp();
    return interaction.reply({ embeds: [selfActionEmbed], ephemeral: true });
  }

  if (targetMember && targetMember.roles.highest.position >= member.roles.highest.position) {
    const roleHierarchyEmbed = new EmbedBuilder()
      .setColor("#e44144")
      .setTitle("Action Denied")
      .setDescription("You cannot perform this action on a user with a higher or equal role.")
      .setTimestamp();
    return interaction.reply({ embeds: [roleHierarchyEmbed], ephemeral: true });
  }

      const subcommand = interaction.options.getSubcommand();
      const IAWEBHOOK = process.env.IAWEBHOOK;


     
      
      if (subcommand === "give") {
        const warnedUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const image = interaction.options.getAttachment("image");
        const warningId = uuidv4();

        if (!member.roles.cache.has(hrRole)) {
          const noPermissionEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }
  
        
  
          if (interaction.user.id === targetUser?.id) {
            const selfActionEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on yourself.")
              .setTimestamp();
            return interaction.reply({ embeds: [selfActionEmbed], ephemeral: true });
          }
  
          if (targetMember?.bot) {
            const botActionEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on a bot.")
              .setTimestamp();
            return interaction.reply({ embeds: [botActionEmbed], ephemeral: true });
          }
  
          if (targetMember && targetMember.roles.highest.position >= member.roles.highest.position) {
            const roleHierarchyEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on a user with a higher or equal role.")
              .setTimestamp();
            return interaction.reply({ embeds: [roleHierarchyEmbed], ephemeral: true });
          }

        const newWarning = new Warning({
          warningId,
          userId: warnedUser.id,
          reason,
          image: image ? image.url : null,
        });

        await newWarning.save();

        const logEmbed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("New Warning Issued")
          .setDescription(`A new warning has been issued in KOG\nWarning ID: **${warningId}**\n\n**User:** <@${warnedUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Moderator:** <@${interaction.user.id}>`)
          .setTimestamp();

        if (image) logEmbed.setImage(image.url);

        axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        });

        const dmEmbed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("KOG | Warning Issued")
          .setDescription("You have received a warning in Kleiner Oil Group.")
          .addFields({ name: "Reason", value: reason })
          .setTimestamp();

        if (image) dmEmbed.setImage(image.url);

        await warnedUser.send({ embeds: [dmEmbed] }).catch(() => {
          console.error(`Failed to send DM to user ${warnedUser.tag}`);
        });

        const successEmbed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Warning Issued")
          .setDescription(`Successfully warned <@${warnedUser.id}>.`)
          .addFields(
            { name: "Reason", value: reason },
            { name: "Warning ID", value: warningId }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [successEmbed], ephemeral: true });

      } else if (subcommand === "remove") {
        const warningId = interaction.options.getString("warningid");
        const removalReason = interaction.options.getString("reason");

        const warning = await Warning.findOne({ warningId });

        if (!member.roles.cache.has(hrRole)) {
          const noPermissionEmbed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }
  
        
  
          if (interaction.user.id === targetUser?.id) {
            const selfActionEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on yourself.")
              .setTimestamp();
            return interaction.reply({ embeds: [selfActionEmbed], ephemeral: true });
          }
  
          if (targetMember?.bot) {
            const botActionEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on a bot.")
              .setTimestamp();
            return interaction.reply({ embeds: [botActionEmbed], ephemeral: true });
          }
  
          if (targetMember && targetMember.roles.highest.position >= member.roles.highest.position) {
            const roleHierarchyEmbed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Action Denied")
              .setDescription("You cannot perform this action on a user with a higher or equal role.")
              .setTimestamp();
            return interaction.reply({ embeds: [roleHierarchyEmbed], ephemeral: true });
          }

        if (!warning) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Warning Not Found")
            .setDescription(`No warning with ID ${warningId} was found.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await warning.deleteOne();

        const logEmbed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("New Warning Removed")
          .setDescription(`A warning has been removed by a moderator\n**Warning ID:** ${warningId}\n\n**User:** <@${warning.userId}>\n**Original Reason:** ${warning.reason}\n**Removal Reason:** ${removalReason}\n**Removing Officer**: <@${interaction.user.id}>\n**Date Removed:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Evidence:** ${warning.image ? "See below" : "None"}`)
          .setTimestamp();

        if (warning.image) logEmbed.setImage(warning.image);

        axios.post(IAWEBHOOK, {
          embeds: [logEmbed.toJSON()]
        });

        const successEmbed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Warning Removed")
          .setDescription(`Warning ID ${warningId} has been successfully removed.`)
          .setTimestamp();

        return interaction.reply({ embeds: [successEmbed], ephemeral: true });

      } else if (subcommand === "check") {
        const userToCheck = interaction.options.getUser("user");
        const warnings = await Warning.find({ userId: userToCheck.id });

        if (warnings.length === 0) {
          const embed = new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle("No Warnings Found")
            .setDescription(`No warnings have been recorded for <@${userToCheck.id}>.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const warningList = warnings.map((warning) => `
      **Warning ID:** ${warning.warningId}
      **Reason:** ${warning.reason}
      **Date Issued:** <t:${Math.floor(new Date(warning.date).getTime() / 1000)}:F>
      ${warning.image ? `**Evidence:** [View Image](${warning.image})` : ""}
        `).join("\n────────────────────────\n");

        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("User Warnings")
          .setDescription(`Warnings for <@${userToCheck.id}>:\n\n${warningList}`)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (err) {
      console.error("[ERROR] Error in warn command:", err);
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Error Occurred")
        .setDescription("An error occurred while processing your request. Please try again later.")
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
