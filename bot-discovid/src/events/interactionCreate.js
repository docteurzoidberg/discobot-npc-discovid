//this module handles all the interactions
module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    //command
    if (interaction.isCommand()) {
      client.logger.info(
        `<${
          interaction.user.tag
        }> used command ${interaction.commandName.toUpperCase()} in #${interaction.channel.name.toUpperCase()}`
      );

      //await interaction.deferReply({ephemeral: false}).catch(()=>{});
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      if (!command.execute) return;
      try {
        await command.execute(client, interaction);
      } catch (error) {
        client.logger.error(error);
        await interaction.reply({
          content:
            "Erreur lors de l'execution de la commande. (Dire a l'admin de look les logs) !",
          ephemeral: true,
        });
      }
    }
    //autocomplete
    else if (interaction.isAutocomplete()) {
      //read auto complete focused field name from interaction for logging
      const focusedFieldName = interaction.options
        .getFocused(true)
        ?.name.toUpperCase();
      client.logger.info(
        `<${
          interaction.user.tag
        }> triggered AUTOCOMPLETE for field ${focusedFieldName} in command ${interaction.commandName.toUpperCase()} in #${interaction.channel.name.toUpperCase()}`
      );

      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      if (!command.autocomplete) return;

      try {
        await command.autocomplete(client, interaction);
      } catch (error) {
        client.logger.error(error);
      }
    } else if (interaction.isButton()) {
      const customId = interaction.customId;
      client.logger.info(
        `<${
          interaction.user.tag
        }> clicked button ${customId.toUpperCase()} in #${interaction.channel.name.toUpperCase()}`
      );

      await interaction.deferUpdate({ ephemeral: false }).catch(() => {});
      const button = client.buttons.get(customId);
      if (!button) {
        client.logger.warn(`Button ${customId} not found`);
        return;
      }
      try {
        await button.execute(client, interaction);
      } catch (error) {
        client.logger.error(`Error while executing button ${customId}:`);
        client.logger.error(error);
        //await interaction.reply({ content: 'There was an error while executing this button!', ephemeral: true });
      }
    }
    //unhandled interaction
    else {
      const interactionName = interaction.commandName;
      const interactiontype = interaction.type;
      client.logger.warn(
        `<${
          interaction.user.tag
        }> in #${interaction.channel.name.toUpperCase()} triggered an unhandled interaction, type: ${interactiontype}, name: ${interactionName}  `
      );
    }
    return;
  },
};
