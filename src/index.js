require('dotenv').config();
const { Client, Events, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const isDevMode = process.argv.includes('--dev');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
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

client.once(Events.ClientReady, () => {
	if (!isDevMode) {
		console.log(`Logged in as ${client.user.tag}!`);
	} else {
		console.log(`Logged in as ${client.user.tag} in Development Mode!`);
	}

	if (isDevMode) {
		client.user.setPresence({
			activities: [{ name: 'in Development Mode', type: ActivityType.Playing }],
			status: 'dnd' 
		});
	} else {
		client.user.setPresence({
			activities: [{ name: 'with your database', type: ActivityType.Playing }],
			status: 'online',   
		});
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	if (isDevMode && !config.developers.includes(interaction.user.id)) {
		const reply = {
			embeds: [{
				title: "Bot in Development Mode",
				description: 'The bot is currently in development mode and only developers can run commands.',
				color: 0xed4245,
			}],
			ephemeral: true,
		};
		return interaction.reply(reply);
	}

	const devUsers = config.developers || [];

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	if (command.dev && !devUsers.includes(interaction.user.id)) {
		const reply = {
			embeds: [{
				title: "Command in Dev Mode",
				description: 'This command is not available to you and is under development.',
				color: 0xed4245,
			}],
			ephemeral: true,
		};
		return interaction.reply(reply);
	}
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