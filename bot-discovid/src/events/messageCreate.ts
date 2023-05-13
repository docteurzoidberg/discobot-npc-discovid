/* eslint-disable @typescript-eslint/no-explicit-any */
import * as api from '../lib/api';

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    //ignore bot messages
    if (message.author.bot) return;

    //message is not a reply
    if (!message.reference) return;

    //fetch reference (replied) message
    const referenceMessage = await message.channel.messages.fetch(
      message.reference.messageId
    );

    if (!referenceMessage.author.bot) return;

    if (!referenceMessage.embeds || referenceMessage.embeds.length < 1) {
      return;
    }

    const embed = referenceMessage.embeds[0];
    const match = embed.url.match(/title\/tt(.*)/);
    if (!match && match.length < 2) {
      client.logger.error(`No match for ${embed.url}`);
      return;
    }
    const imdbId = match[1];
    client.logger.debug(`message reference movie id : ${imdbId}`);
    const newReactions: Array<any> = [];
    newReactions.push({ user: message.author, reaction: message.content });
    try {
      await api.addReactions({ movieId: imdbId, reactions: newReactions });
      message.reply(`Merci pour l'avis, c'est noté !`);
    } catch (error) {
      client.logger.error('Something went wrong when adding reactions:');
      client.logger.error(error);
      message.reply(`Désolé, je n'ai pas pu enregistrer ton avis...`);
    }
  },
};
