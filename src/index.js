
require('dotenv').config();
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const folders = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(folders);
for (const folder of commandFolders) {
	const commandsPath = path.join(folders, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
	}
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error('Error executing command:', error);
		const reply = {
			content: 'There was an error while executing this command!',
			ephemeral: true,
		};
		interaction.replied || interaction.deferred
			? await interaction.followUp(reply)
			: await interaction.reply(reply);
	}
});

client.login(process.env.TOKEN);
