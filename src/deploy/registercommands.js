const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandNames = new Set();
const foldersPath = path.join(__dirname, '..', 'commands');
let commandFolders = [];
if (fs.existsSync(foldersPath)) {
	commandFolders = fs.readdirSync(foldersPath);
} else {
	console.error(`[ERROR] The directory at ${foldersPath} does not exist.`);
}

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
			commandNames.add(command.data.name);
		}
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		console.log(`Refreshing ${commands.length} commands for all guilds...`);

		const guildIds = ['1078478406745866271', '857445688932696104', '1313768451768188948'];
		const clientId = process.env.CLIENT_ID;

		for (const guildId of guildIds) {
			const registeredCommands = await rest.get(
				Routes.applicationGuildCommands(clientId, guildId.trim())
			);

			let deleted = 0;
			for (const cmd of registeredCommands) {
				if (!commandNames.has(cmd.name)) {
					await rest.delete(
						Routes.applicationGuildCommand(clientId, guildId.trim(), cmd.id)
					);
					deleted++;
				}
			}

			const data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId.trim()),
				{ body: commands },
			);

			let guildName;
			if (guildId === '1078478406745866271') {
				guildName = 'KIAD';
			} else if (guildId === '857445688932696104') {
				guildName = 'KOG';
			} else if (guildId === '1313768451768188948') {
				guildName = 'SQUADS';
			} else {
				guildName = 'Unknown Guild';
			}
			console.log(`[${guildName}] Reloaded: ${data.length}, Deleted: ${deleted}`);
		}
	}
	catch (error) {
		console.error(error);
	}
})();
