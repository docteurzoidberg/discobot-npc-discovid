/* eslint-disable @typescript-eslint/no-explicit-any */
import * as api from '../lib/api';

module.exports = {
  name: 'messageReactionAdd',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(client, reaction, user) {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
      try {
        await reaction.fetch();
      } catch (error) {
        client.logger.error('Something went wrong when fetching the message:');
        client.logger.error(error);
        // Return as `reaction.message.author` may be undefined/null
        return;
      }
    }
    // Now the message has been cached and is fully available

    if (!reaction.message.author.bot) return;
    if (!reaction.message.embeds || reaction.message.embeds.length < 1) return;

    client.logger.info(
      `${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`
    );
    // The reaction is now also fully available and the properties will be reflected accurately:
    client.logger.info(
      `${reaction.count} user(s) have given the same reaction to this message!`
    );

    //imdbid?
    const match = reaction.message.embeds[0].url.match(/title\/tt(.*)/);
    if (!match || match.lenght < 2) {
      client.logger.warn('No imdbid found');
      return;
    }

    const imdbid = match[1];
    client.logger.debug('IMDBID: ' + imdbid);
    try {
      const newReactions: Array<any> = [];
      const users = await reaction.users.fetch();
      users.map((u) => {
        newReactions.push({ user: u, emoji: reaction.emoji.name });
      });
      const data = await api.addReactions({
        movieId: imdbid,
        reactions: newReactions,
      });
      client.logger.debug(data);
    } catch (error) {
      client.logger.error(error);
    }
  },
};
