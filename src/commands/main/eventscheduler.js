const { SlashCommandBuilder } = require('discord.js');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const schema = require('../../schemas/eventSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Manage events')
        .addSubcommand(subcommand =>
            subcommand
                .setName('schedule')
                .setDescription('Schedule a new event, KOG only.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an existing event')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique identifier for the event')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reschedule')
                .setDescription('reschedule an existing event')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique identifier for the event')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('unix')
                        .setDescription('New Unix timestamp for the event')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start an event')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique identifier for the event')
                        .setRequired(true)
                ).addStringOption(option =>
                    option
                        .setName('notes')
                        .setDescription('Notes for the event')
                        .setRequired(false)
                ).addStringOption(option =>
                    option
                        .setName('link')
                        .setDescription('Link to join the event')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('conclude')
                .setDescription('Conclude an event')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique identifier for the event')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const eventId = interaction.options.getString('id');
        const mrId = '1193414880498286703';
        const hrId = '917829003660910633';
        const memberRoles = interaction.member.roles.cache;
        const eventChannel = interaction.client.channels.cache.get('1142584396092821594');
        const restrictedGuildIds = ['1313768451768188948', '1078478406745866271'];

        if (interaction.guildId === restrictedGuildIds){
            return interaction.reply({
                embeds: [{
                    title: "No Permission",
                    description: 'You cannot run this command in this server. Please use in the main server.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

       if (!memberRoles.has(mrId) && !memberRoles.has(hrId) && !memberRoles.has('875599118632878092')) {
            return interaction.reply({
                embeds: [{
                    title: "No Permission",
                    description: 'You cannot run this command as you do not have permission.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

        if (subcommand === 'schedule') {
            const modal = new ModalBuilder()
                .setCustomId('eventScheduling')
                .setTitle('Schedule a New Event');

            const hostInput = new TextInputBuilder()
                .setCustomId('host')
                .setLabel('Event Host')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('TylersTears')
                .setRequired(true);

            const typeInput = new TextInputBuilder()
                .setCustomId('type')
                .setLabel('Event Type')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Raid')
                .setRequired(true);

            const unixInput = new TextInputBuilder()
                .setCustomId('unix')
                .setLabel('Event Time (Unix Timestamp)')
                .setPlaceholder('193847494')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const gameInput = new TextInputBuilder()
                .setCustomId('game')
                .setLabel('Game')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('QSERF')
                .setRequired(true);

            const noteInput = new TextInputBuilder()
                .setCustomId('note')
                .setLabel('Additional Notes (Optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('QDF may be expected!')
                .setRequired(false);

            const actionRow1 = new ActionRowBuilder().addComponents(hostInput);
            const actionRow2 = new ActionRowBuilder().addComponents(typeInput);
            const actionRow3 = new ActionRowBuilder().addComponents(unixInput);
            const actionRow4 = new ActionRowBuilder().addComponents(gameInput);
            const actionRow5 = new ActionRowBuilder().addComponents(noteInput);

            modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4, actionRow5);

            await interaction.showModal(modal);
        } else if (subcommand === 'cancel') {
            const event = await schema.findOne({ uuid: eventId });

            if (!event) {
                return interaction.reply({
                    
                    embeds: [{
                        title: "Event Not Found",
                        description: `No event found with the ID: ${eventId}`,
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            if (event.host !== interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        title: "Unauthorized",
                        description: 'Only the host of the event can cancel it.',
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            await schema.deleteOne({ uuid: eventId });

            if (event.messageLink) {
                const message = await eventChannel.messages.fetch(event.messageLink);
                await message.reply({
                    embeds: [{
                        title: "Event Cancelled",
                        description: `The following event has been cancelled by the host: **<@${interaction.user.id}>**.`,
                        color: 0xed4245,
                    }],
                });
            }

            return interaction.reply({
                embeds: [{
                    title: "Event Cancelled",
                    description: `You have successfully cancelled the event with ID: ${eventId}.`,
                    color: 0x57f287,
                }],
                ephemeral: true,
            });
        } else if (subcommand === 'reschedule') {
            const newUnixTimestamp = interaction.options.getString('unix');
            const event = await schema.findOne({ uuid: eventId });

            if (!event) {
                return interaction.reply({
                    embeds: [{
                        title: "Event Not Found",
                        description: `No event found with the ID: ${eventId}`,
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            if (event.host !== interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        title: "Unauthorized",
                        description: 'Only the host of the event can postpone it.',
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            event.unix = newUnixTimestamp;
            await event.save();

            if (event.messageLink) {
                const message = await eventChannel.messages.fetch(event.messageLink);
                await message.reply({
                    embeds: [{
                        content: `<@&857447103097602058>, <@&896891649064575016>`,
                        title: "Event Rescheduled",
                        description: `The event has been Rescheduled to the new time: <t:${newUnixTimestamp}:F> by the host: **<@${interaction.user.id}>**.`,
                        color: 0xfee75c,
                    }],
                });
            }

            return interaction.reply({
                embeds: [{
                    title: "Event Postponed",
                    description: `You have successfully postponed the event with ID: ${eventId} to the new time: <t:${newUnixTimestamp}:F>.`,
                    color: 0x57f287,
                }],
                ephemeral: true,
            });
        } else if (subcommand === 'start') {
            const event = await schema.findOne({ uuid: eventId });

            if (!event) {
                return interaction.reply({
                    embeds: [{
                        title: "Event Not Found",
                        description: `No event found with the ID: ${eventId}`,
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            if (event.host !== interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        title: "Unauthorized",
                        description: 'Only the host of the event can start it.',
                        color: 0xed4245,
                    }],
                    ephemeral: true,
                });
            }

            const notes = interaction.options.getString('notes');
            const link = interaction.options.getString('link');

          
            if (notes) {
                event.notes = notes;
            }
            if (link) {
                event.link = link;
            }
            await event.save();

            if (event.messageLink) {
                const message = await eventChannel.messages.fetch(event.messageLink);
                await message.reply({
                    content: `<@&857447103097602058>, <@&896891649064575016>`,
                    embeds: [{
                        title: "Event Started",
                        description: `The event has started! Hosted by: **<@${interaction.user.id}>**.\n\nPlease join the event if you haven't already.` +
                            (notes ? `\n\n**Notes:** ${notes}` : '') +
                            (link ? `\n\n[Join the event](${link})` : ''),
                        color: 0x57f287,
                    }],
                });
            }

            return interaction.reply({
                embeds: [{
                    title: "Event Started",
                    description: `You have successfully started the event with ID: ${eventId}.` +
                        (notes ? `\n\n**Notes:** ${notes}` : '') +
                        (link ? `\n\n[Join the event](${link})` : ''),
                    color: 0x57f287,
                }],
                ephemeral: true,
            });
    } else if (subcommand === 'conclude') {
        const event = await schema.findOne({ uuid: eventId });

        if (!event) {
            return interaction.reply({
                embeds: [{
                    title: "Event Not Found",
                    description: `No event found with the ID: ${eventId}`,
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

        if (event.host !== interaction.user.id) {
            return interaction.reply({
                embeds: [{
                    title: "Unauthorized",
                    description: 'Only the host of the event can conclude it.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

        await schema.deleteOne({ uuid: eventId });

        if (event.messageLink) {
            const message = await eventChannel.messages.fetch(event.messageLink);
            await message.reply({
                embeds: [{
                    title: "Event Concluded",
                    description: `The event has been concluded by the host: **<@${interaction.user.id}>**.`,
                    color: 0x3498db,
                }],
            });
        }

        try {
            await interaction.user.send({
                embeds: [{
                    title: "Event Concluded",
                    description: `The event with ID:\n${eventId}\nHas been successfully concluded and removed from the database. Please ensure to log any necessary details if needed.\nThank you for hosting an event!`,
                    color: 0x57f287,
                }],
            });
        } catch (error) {
            console.error(`Failed to DM the user: ${error}`);
        }

        return interaction.reply({
            embeds: [{
                title: "Event Concluded",
                description: `You have successfully concluded the event with ID: ${eventId}.`,
                color: 0x57f287,
            }],
            ephemeral: true,
        });
    }
}
}
