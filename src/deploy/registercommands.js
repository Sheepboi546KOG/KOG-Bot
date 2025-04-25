const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');



const commands = [];
const foldersPath = path.join(__dirname, '..', 'commands');
let commandFolders = [];
if (fs.existsSync(foldersPath)) {
	commandFolders = fs.readdirSync(foldersPath);
}
else {
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
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Array of guild IDs
		const guildIds = ['1078478406745866271', '857445688932696104', '1313768451768188948'];
		const clientId = process.env.CLIENT_ID; // Your bot's client ID

		for (const guildId of guildIds) {
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
				guildName = 'Unknown Guild'; // best code trust me
			}
			console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildName}.`);
		}
	}
	catch (error) {
		console.error(error);
	}
})();
