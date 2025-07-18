const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ModSchema = require("../../schemas/mods");

const ALLOWED_USER_ID = "1138235120424325160";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Manage mods.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Adds a user to the mod schema.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add as a mod")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Removes a user from the mod schema.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove as a mod")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("Lists all current mods.")
    ),
  async execute(interaction) {
    if (interaction.user.id !== ALLOWED_USER_ID) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Permission Denied")
        .setDescription("You do not have permission to use this command.");
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "add" || subcommand === "remove") {
        const user = interaction.options.getUser("user");
        if (!user) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("User Not Found")
            .setDescription("User not found.");
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }

        const existingMod = await ModSchema.findOne({ userId: user.id });

        if (subcommand === "add") {
          if (existingMod) {
            const embed = new EmbedBuilder()
              .setColor(0xffa500)
              .setTitle("Already a Mod")
              .setDescription(`${user.tag} is already a mod.`);
            return interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }
          await new ModSchema({
            userId: user.id,
            username: user.username,
            addedAt: new Date(),
          }).save();
          const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Mod Added")
            .setDescription(`${user.tag} has been added as a mod.`);
          return interaction.reply({
            embeds: [embed],
          });
        }

        if (!existingMod) {
          const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("Not a Mod")
            .setDescription(`${user.tag} is not a mod.`);
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
        await ModSchema.deleteOne({ userId: user.id });
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Mod Removed")
          .setDescription(`${user.tag} has been removed as a mod.`);
        return interaction.reply({
          embeds: [embed],
        });
      }

      if (subcommand === "list") {
        const mods = await ModSchema.find();
        if (!mods.length) {
          const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("No Mods Found")
            .setDescription("No mods found.");
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
        const modList = mods
          .map((mod) => `<@${mod.userId}>`)
          .join("\n");
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Current Mods")
          .setDescription(modList);
        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("An error occurred while managing the mod schema.");
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
