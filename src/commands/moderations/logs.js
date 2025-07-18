const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Warning = require("../../schemas/warn.js");
const Ban = require("../../schemas/bans.js");
 const modSchema = require("../../schemas/mods.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("log")
        .setDescription("View a user's moderation logs.")
        .addUserOption(opt =>
            opt.setName("user").setDescription("User to check.").setRequired(true)
        ),

    async execute(interaction) {
        const modEntry = await modSchema.findOne({ userId: interaction.user.id });
        
        if (!modEntry) {
            const noPermissionEmbed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Permission Denied")
                .setDescription("You do not have permission to use this command.\nIf your are a KIAD agent, please contact Sheepboi546.")
                .setTimestamp();
            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }


        const userToCheck = interaction.options.getUser("user");

   
        const warnings = await Warning.find({ userId: userToCheck.id, removed: false });
        const bans = await Ban.find({ userId: userToCheck.id });


       
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
        active: b.active
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
**Type:** ${log.type}${log.type === "Ban" && log.active === false ? " (Inactive)" : ""}
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
