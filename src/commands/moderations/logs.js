const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../schemas/warn.js");
const Ban = require("../../schemas/bans.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("log")
        .setDescription("View a user's moderation logs.")
        .addUserOption(opt =>
            opt.setName("user").setDescription("User to check.").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        // Check if the user has permission to use this comman
        const modSchema = require("../../schemas/mods.js");
         const haspermission = await modSchema.findOne({ userId: interaction.user.id });
        
            if (!haspermission) {
              const noPermissionEmbed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Permission Denied")
                .setDescription("You do not have permission to use this command.")
                .setTimestamp();
              return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
            }


        const userToCheck = interaction.options.getUser("user");

        // Fetch logs
        const warnings = await Warning.find({ userId: userToCheck.id, removed: false });
        const bans = await Ban.find({ userId: userToCheck.id, active: true });

        // Format logs
        const logs = [
            ...warnings.map(w => ({
                type: "Warning",
                id: w.warningId || "N/A",
                reason: w.reason,
                date: w.date,
                image: w.image || null,
            })),
            ...bans.map(b => ({
                type: "Ban",
                id: "N/A",
                reason: b.reason,
                date: b.bannedAt,
                image: null,
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (logs.length === 0) {
            const noLogEmbed = new EmbedBuilder()
                .setColor("#2da4cc")
                .setTitle("No Logs Found")
                .setDescription(`No logs recorded for <@${userToCheck.id}>.`)
                .setTimestamp();

            return interaction.reply({ embeds: [noLogEmbed], ephemeral: true });
        }

        const logList = logs.map(log => `
**Type:** ${log.type}
${log.id !== "N/A" ? `**Log ID:** \`${log.id}\`` : ""}
**Reason:** ${log.reason}
**Date Issued:** <t:${Math.floor(new Date(log.date).getTime() / 1000)}:F>
${log.image ? `**Evidence:** [View Image](${log.image})` : ""}`.trim()
        ).join("\n────────────────────────\n");

        const logEmbed = new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle(`Logs for ${userToCheck.tag}`)
            .setDescription(logList)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [logEmbed], ephemeral: true });
    },
};
