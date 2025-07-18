const { REST, Routes } = require("discord.js");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

const commands = [];
const commandNames = new Set();
const foldersPath = path.join(__dirname, "..", "commands");

if (!fs.existsSync(foldersPath)) {
  console.error(`[ERROR] The directory at ${foldersPath} does not exist.`);
}

for (const folder of fs.readdirSync(foldersPath)) {
  const commandsPath = path.join(foldersPath, folder);
  for (const file of fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"))) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      commands.push(command.data.toJSON());
      commandNames.add(command.data.name);
    }
  }
}

const rest = new REST().setToken(process.env.TOKEN);
const guilds = [
  { id: "1078478406745866271", name: "KIAD" },
  { id: "857445688932696104", name: "KOG" },
  { id: "1313768451768188948", name: "SQUADS" },
  { id: "1351686597447389184", name: "Unknown Guild" },
];
const clientId = process.env.CLIENT_ID;

(async () => {
  try {
    console.log(`Refreshing ${commands.length} commands for all guilds...`);
    for (const { id: guildId, name: guildName } of guilds) {
      const registered = await rest.get(
        Routes.applicationGuildCommands(clientId, guildId)
      );
      let deleted = 0;
      for (const cmd of registered) {
        if (!commandNames.has(cmd.name)) {
          await rest.delete(
            Routes.applicationGuildCommand(clientId, guildId, cmd.id)
          );
          deleted++;
        }
      }
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(
        `[${guildName}] Reloaded: ${data.length}, Deleted: ${deleted}`
      );
    }
  } catch (error) {
    console.error(error);
  }
})();
