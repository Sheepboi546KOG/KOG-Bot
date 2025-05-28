const { SlashCommandBuilder } = require('discord.js');

const ModSchema = require('../../schemas/mods'); 

const ALLOWED_USER_ID = '1138235120424325160'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Manage mods.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds a user to the mod schema.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add as a mod')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a user from the mod schema.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove as a mod')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all current mods.')),
    async execute(interaction) {

        if (interaction.user.id !== ALLOWED_USER_ID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'add') {
                const user = interaction.options.getUser('user');
                if (!user) {
                    return interaction.reply({ content: 'User not found.', ephemeral: true });
                }

                const existingMod = await ModSchema.findOne({ userId: user.id });
                if (existingMod) {
                    return interaction.reply({ content: `${user.tag} is already a mod.`, ephemeral: true });
                }

                const newMod = new ModSchema({
                    userId: user.id,
                    username: user.tag,
                    addedAt: new Date()
                });

                await newMod.save();

                interaction.reply({ content: `${user.tag} has been added as a mod.` });
            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                if (!user) {
                    return interaction.reply({ content: 'User not found.', ephemeral: true });
                }

                const existingMod = await ModSchema.findOne({ userId: user.id });
                if (!existingMod) {
                    return interaction.reply({ content: `${user.tag} is not a mod.`, ephemeral: true });
                }

                await ModSchema.deleteOne({ userId: user.id });

                interaction.reply({ content: `${user.tag} has been removed as a mod.` });
            } else if (subcommand === 'list') {
                const mods = await ModSchema.find();

                if (mods.length === 0) {
                    return interaction.reply({ content: 'No mods found.', ephemeral: true });
                }

                const modList = mods.map(mod => `<@${mod.userId}> (Username: ${mod.username})`).join('\n');
                interaction.reply({ content: `Current mods:\n${modList}`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while managing the mod schema.', ephemeral: true });
        }
    }
};