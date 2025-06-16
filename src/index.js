require('dotenv').config();
const { Client, Events, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const mongoose = require('mongoose');


const isDevMode = process.argv.includes('--dev');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();

process.env.FFMPEG_PATH = require('ffmpeg-static');


require('./handlers/modalHandler')(client);

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

    const presences = isDevMode
        ? [
            { activities: [{ name: 'in Development Mode', type: ActivityType.Playing }], status: 'dnd' },
            
        ]
        : [
            { activities: [{ name: 'with KOG logging!', type: ActivityType.Playing }], status: 'online' },
            { activities: [{ name: 'TylersTears Crying', type: ActivityType.Listening }], status: 'online' },
            { activities: [{ name: '🐈‍⬛', type: ActivityType.Playing }], status: 'online' },
            { activities: [{ name: 'QS and T3 spamming', type: ActivityType.Playing }], status: 'online' },
            { activities: [{ name: 'And Justice For All... - Metallica', type: ActivityType.Listening }], status: 'online' },
            { activities: [{ name: 'You, I am watching you.', type: ActivityType.Watching }], status: 'online' },
            { activities: [{ name: 'with KIADs Appeals', type: ActivityType.Playing }], status: 'online' },
        ];

    let index = 0;
    setInterval(() => {
        client.user.setPresence(presences[index]);
        index = (index + 1) % presences.length;
    }, 5000); 
});

client.on(Events.InteractionCreate, async (interaction) => {
    const devUsers = config.developers || [];

    if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId);
        if (!modal) return;
        try {
            await modal.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this modal!',
                ephemeral: true,
            });
        }
        return;
    }

    if (interaction.isChatInputCommand()) {
        if (isDevMode && !devUsers.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [{
                    title: "Bot in Development Mode",
                    description: 'The bot is currently in development mode and only developers can run commands.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }
        

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        if (command.dev && !devUsers.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [{
                    title: "Command in Dev Mode",
                    description: 'This command is not available to you and is under development.',
                    color: 0xed4245,
                }],
                ephemeral: true,
            });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            const reply = {
                content: 'There was an error while executing this command!',
                ephemeral: true,
            };
            interaction.replied || interaction.deferred
                ? await interaction.followUp(reply)
                : await interaction.reply(reply);
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase().includes('tyler')) {
        await message.reply('Bro that guy stinks so much');
    }

    if (message.content.toLowerCase().includes('aladeen')) {
        await message.reply('https://th.bing.com/th/id/OIP.tTh2ZpKNJ-3HBpJKaW_5RwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3');
        return;
    }

    if (message.mentions.users.has('845719138836021278')) {
        await message.reply('https://cdn.discordapp.com/attachments/1313568200100679700/1381368850544857238/watermark.gif?ex=685126be&is=684fd53e&hm=c6e8acd6a967fec3e6c5366d8092700c48431365da8e60f9c21154f16864d08f&');
        return;
    }

    if (
        message.content.toLowerCase().includes('gay') ||
        message.content.toLowerCase().includes('femboy') ||
        message.content.toLowerCase().includes('furry')
    ) {
        await message.reply('<@1125601338768756756>');
        return;
    }
});

mongoose.connect(process.env.MONGO_URI, {})
	.then(() => console.log('Connected to MongoDB successfully.'))
	.catch((error) => {
		console.error('Error connecting to MongoDB:', error);
		process.exit(1);
	});

client.login(process.env.TOKEN)
