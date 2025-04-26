const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Colors } = require("discord.js");
const MyData = require('../../schemas/mydata'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventlog")
        .setDescription("Log an event with attendees."),

    async execute(interaction) {
        try {
            const mrId = '1193414880498286703';
            const hrId = '917829003660910633';
            const eventChannel = interaction.client.channels.cache.get('1002610487378321520');
            const restrictedGuildIds = ['1313768451768188948', '1078478406745866271',''];
            const memberRoles = interaction.member.roles.cache;
            const interactionMessages = [];

            if (restrictedGuildIds.includes(interaction.guildId)) {
                if (!interaction.replied) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setTitle("Wrong Server")
                            .setDescription('Please use this command in the main server (KOG).')
                            .setColor(Colors.Red)],
                        ephemeral: true,
                    });
                }
            }

            if (!memberRoles.has(mrId) && !memberRoles.has(hrId)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle("No Permission")
                        .setDescription('You do not have permission to use this command.')
                        .setColor(Colors.Red)],
                    ephemeral: true,
                });
            }

            const eventSelectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("event_type")
                    .setPlaceholder("Select Event Type")
                    .addOptions([
                        { label: "Raid", value: "Raid" },
                        { label: "Private Rally", value: "Rally" },
                        { label: "Training", value: "Training" },
                        { label: "Gamenight", value: "Gamenight" },
                        { label: "Other", value: "Other" },
                    ])
            );

            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle("Event Log")
                .setDescription("Please select the event type below.")
                .setTimestamp();

            const selectionMessage = await interaction.reply({
                embeds: [embed],
                components: [eventSelectMenu],
                ephemeral: false,
                fetchReply: true,
            });

            interactionMessages.push(selectionMessage);

            const eventSelectCollector = selectionMessage.createMessageComponentCollector({
                filter: (i) => i.customId === "event_type" && i.user.id === interaction.user.id,
                time: 60000
            });

            eventSelectCollector.on("collect", async (i) => {
                let attendees = []; 
                const eventType = i.values[0];

                const attendeesEmbed = new EmbedBuilder()
                    .setColor(Colors.Purple)
                    .setTitle("Ping the Attendees")
                    .setDescription("Mention all the attendees and send the message. Then click **Done**.\n\nExample: <@123><@456>")
                    .setTimestamp();

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("done").setLabel("Done").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
                );

                const attendeesPrompt = await i.reply({
                    embeds: [attendeesEmbed],
                    components: [actionRow],
                    fetchReply: true
                });
                interactionMessages.push(attendeesPrompt);

                const mentionCollector = interaction.channel.createMessageCollector({
                    filter: m => m.author.id === interaction.user.id && m.mentions.users.size > 0,
                    time: 60000
                });

                mentionCollector.on("collect", (message) => {
                    interactionMessages.push(message);
                    message.mentions.users.forEach(user => {
                        const mention = user.id; 
                        if (!attendees.includes(mention)) attendees.push(mention);
                    });
                });

                const buttonCollector = attendeesPrompt.createMessageComponentCollector({
                    filter: btn => btn.user.id === interaction.user.id,
                    time: 60000
                });

                buttonCollector.on("collect", async (btn) => {
                    buttonCollector.stop();
                    mentionCollector.stop();

                    if (btn.customId === "cancel") {
                        await btn.reply({ content: "❌ Event log process canceled.", ephemeral: true });
                        return cleanup(interactionMessages);
                    }

                    let meritAttendees = [];
                    const meritEmbed = new EmbedBuilder()
                        .setColor(Colors.Gold)
                        .setTitle("Merit")
                        .setDescription("Mention anyone who earned a merit or type **None**. Then click **Done**.")
                        .setTimestamp();

                    const meritButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("merit_done").setLabel("Done").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId("merit_cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
                    );

                    const meritPrompt = await btn.reply({
                        embeds: [meritEmbed],
                        components: [meritButtons],
                        fetchReply: true
                    });
                    interactionMessages.push(meritPrompt);

                    const meritCollector = interaction.channel.createMessageCollector({
                        filter: m => m.author.id === interaction.user.id,
                        time: 60000
                    });

                    let stopReason = null;
                    meritCollector.on("collect", (msg) => {
                        interactionMessages.push(msg);
                        if (msg.content.toLowerCase() === "none") {
                            stopReason = "none";
                            return meritCollector.stop("none");
                        }
                        msg.mentions.users.forEach(user => {
                            const mention = user.id; 
                            if (!meritAttendees.includes(mention)) meritAttendees.push(mention);
                        });
                    });

                    const meritButtonCollector = meritPrompt.createMessageComponentCollector({
                        filter: b => b.user.id === interaction.user.id,
                        time: 60000
                    });

                    meritButtonCollector.on("collect", async (b) => {
                        meritCollector.stop();
                        meritButtonCollector.stop();

                        if (b.customId === "merit_cancel") {
                            await b.reply({ content: "❌ Event log process canceled.", ephemeral: true });
                            return cleanup(interactionMessages);
                        }

                        const finalEmbed = new EmbedBuilder()
                            .setColor(Colors.Purple)
                            .setTitle("New Event Logged!")
                            .addFields(
                                { name: "Event Type", value: eventType, inline: true },
                                { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                { name: "Host", value: `<@${interaction.user.id}>` },
                                { name: "Attendees", value: attendees.length ? attendees.map(id => `<@${id}>`).join("\n") : "None" },
                                { name: "Merits", value: meritAttendees.length ? meritAttendees.map(id => `<@${id}>`).join("\n") : "None" },
                            )
                            .setTimestamp();

                        await eventChannel.send({ embeds: [finalEmbed] });

                        await interaction.followUp({
                            content: "✅ Event has been logged successfully!",
                            ephemeral: true
                        });

                        cleanup(interactionMessages);

                        
                        if (typeof attendees !== 'undefined') {
                            for (const userId of attendees) {
                                const existingData = await MyData.findOne({ userId });

                                if (existingData) {
                                    await MyData.updateOne({ userId }, { $inc: { eventsAttended: 1 } });
                                } else {
                                    const newData = new MyData({ userId, eventsAttended: 1 });
                                    await newData.save();
                                }
                            }

                           

                            for (const userId of meritAttendees) {
                                const existingData = await MyData.findOne({ userId });

                                if (existingData) {
                                    await MyData.updateOne({ userId }, { $inc: { merits: 1 } });
                                }
                            }
                        }
                    });
                });
            });

            async function cleanup(messages) {
                for (const msg of messages) {
                    try {
                        if (msg.deletable) await msg.delete();
                    } catch (err) {
                        console.warn("Couldn't delete message:", err);
                    }
                }
            }
        } catch (err) {
            console.error("Error in /eventlog:", err);
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("Error")
                    .setDescription("An unexpected error occurred. Please try again later.")
                    .setTimestamp()],
                ephemeral: true
            });
        }
    }
};
