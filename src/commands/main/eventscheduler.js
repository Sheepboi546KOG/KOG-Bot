const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { schema } = require('../../schemas/eventSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Manage events')
        .addSubcommand(subcommand =>
            subcommand
                .setName('schedule')
                .setDescription('Schedule a new event (restricted to specific role)')
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
                .setName('postpone')
                .setDescription('Postpone an existing event')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('Unique identifier for the event')
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
        const memberRoles = interaction.member.roles.cache;

        if (!memberRoles.has(mrId)) {
            return interaction.reply({
                embeds: [{
                    title: "Bot in Development Mode",
                    description: 'The bot is currently in development mode and only developers can run commands.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

        if (subcommand === 'schedule') {
            const modal = new ModalBuilder()
                .setCustomId(`eventScheduling`) 
                .setTitle('Schedule a New Event');

            const hostInput = new TextInputBuilder()
                .setCustomId(`host`) 
                .setLabel('Event Host')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('TylersTears')
                .setRequired(true);

            const type = new TextInputBuilder()
                .setCustomId(`type`)
                .setLabel('Event Type')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Raid')
                .setRequired(true);

            const unixInput = new TextInputBuilder()
                .setCustomId(`unix`)
                .setLabel('Event Time (Unix Timestamp (Eg: 1691234567))')
                .setPlaceholder('193847494')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const gameInput = new TextInputBuilder()
                .setCustomId(`game`)
                .setLabel('Game')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('QSERF')
                .setRequired(true);

            const noteInput = new TextInputBuilder()
                .setCustomId(`note`)
                .setLabel('Additional Notes (Optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('QDF may be expected!')
                .setRequired(false);

            const actionRow1 = new ActionRowBuilder().addComponents(hostInput);
            const actionRow2 = new ActionRowBuilder().addComponents(type);
            const actionRow3 = new ActionRowBuilder().addComponents(unixInput);
            const actionRow4 = new ActionRowBuilder().addComponents(gameInput);
            const actionRow5 = new ActionRowBuilder().addComponents(noteInput);

            modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4, actionRow5);

            await interaction.showModal(modal);
        }
    },
};
