require("dotenv").config();
const {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");
const mongoose = require("mongoose");

const isDevMode = process.argv.includes("--dev");
process.env.FFMPEG_PATH = require("ffmpeg-static");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.commands = new Collection();
client.modals = new Collection();

require("./handlers/modalHandler")(client);

// Load commands
const commandsDir = path.join(__dirname, "commands");
for (const folder of fs.readdirSync(commandsDir)) {
  const folderPath = path.join(commandsDir, folder);
  for (const file of fs
    .readdirSync(folderPath)
    .filter((f) => f.endsWith(".js"))) {
    const command = require(path.join(folderPath, file));
    if (command.data && command.execute)
      client.commands.set(command.data.name, command);
  }
}

// Presence rotation
const presences = isDevMode
  ? [
      {
        activities: [
          { name: "in Development Mode", type: ActivityType.Playing },
        ],
        status: "dnd",
      },
    ]
  : [
      {
        activities: [{ name: "with KOG logging!", type: ActivityType.Playing }],
        status: "online",
      },
      {
        activities: [
          { name: "TylersTears Crying", type: ActivityType.Listening },
        ],
        status: "online",
      },
      {
        activities: [{ name: "🐈‍⬛", type: ActivityType.Playing }],
        status: "online",
      },
      {
        activities: [
          { name: "QS and T3 spamming", type: ActivityType.Playing },
        ],
        status: "online",
      },
      {
        activities: [
          {
            name: "Of Randombo1xd and Man - Metallica",
            type: ActivityType.Listening,
          },
        ],
        status: "online",
      },
      {
        activities: [
          { name: "You, I am watching you.", type: ActivityType.Watching },
        ],
        status: "online",
      },
      {
        activities: [
          { name: "Fox play with KIADs Appeals", type: ActivityType.Watching },
        ],
        status: "online",
      },
    ];

client.once(Events.ClientReady, () => {
  console.log(
    `Logged in as ${client.user.tag}${isDevMode ? " in Development Mode" : "!"}`
  );
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
        content: "There was an error while executing this modal!",
        ephemeral: true,
      });
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    if (isDevMode && !devUsers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          {
            title: "Bot in Development Mode",
            description:
              "The bot is currently in development mode and only developers can run commands.",
            color: 0xed4245,
          },
        ],
        ephemeral: true,
      });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.dev && !devUsers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          {
            title: "Command in Dev Mode",
            description:
              "This command is not available to you and is under development.",
            color: 0xed4245,
          },
        ],
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Error executing command:", error);
      const reply = {
        content: "There was an error while executing this command!",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase();

  if (content.includes("tyler")) {
    await message.reply("Bro that guy stinks so much");
  } else if (content.includes("aladeen") && Math.random() < 0.1) {
    await message.reply(
      "https://th.bing.com/th/id/OIP.tTh2ZpKNJ-3HBpJKaW_5RwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"
    );
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully."))
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });

client.login(process.env.TOKEN);
