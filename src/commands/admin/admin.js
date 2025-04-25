const { SlashCommandBuilder } = require('discord.js');

const AdminSchema = require('../../schemas/admin'); 

const ALLOWED_USER_ID = '1138235120424325160'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Manage admins.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds a user to the admin schema.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add as an admin')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a user from the admin schema.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove as an admin')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all current admins.')),
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

                const existingAdmin = await AdminSchema.findOne({ userId: user.id });
                if (existingAdmin) {
                    return interaction.reply({ content: `${user.tag} is already an admin.`, ephemeral: true });
                }

                const newAdmin = new AdminSchema({
                    userId: user.id,
                    username: user.tag,
                    addedAt: new Date()
                });

                await newAdmin.save();

                interaction.reply({ content: `${user.tag} has been added as an admin.` });
            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                if (!user) {
                    return interaction.reply({ content: 'User not found.', ephemeral: true });
                }

                const existingAdmin = await AdminSchema.findOne({ userId: user.id });
                if (!existingAdmin) {
                    return interaction.reply({ content: `${user.tag} is not an admin.`, ephemeral: true });
                }

                await AdminSchema.deleteOne({ userId: user.id });

                interaction.reply({ content: `${user.tag} has been removed as an admin.` });
            } else if (subcommand === 'list') {
                const admins = await AdminSchema.find();

                if (admins.length === 0) {
                    return interaction.reply({ content: 'No admins found.', ephemeral: true });
                }

                const adminList = admins.map(admin => `${admin.userId} (ID: ${admin.username})`).join('\n');
                interaction.reply({ content: `Current admins:\n${adminList}` });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while managing the admin schema.', ephemeral: true });
        }
    }
};