import * as api from '../lib/api';

module.exports = {
  name: 'messageReactionRemove',
  async execute(client, reaction, user) {
    if (reaction.partial) {
      // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
      try {
        await reaction.fetch();
      } catch (error) {
        client.logger.error(
          'Something went wrong when fetching the message:',
          error
        );
        // Return as `reaction.message.author` may be undefined/null
        return;
      }
    }

    // Now the message has been cached and is fully available
    if (!reaction.message.author.bot) return;
    if (!reaction.message.embeds || reaction.message.embeds.length < 1) return;

    client.logger.info(
      `${reaction.message.author}'s message "${reaction.message.content}" lost a reaction!`
    );

    //imdbid?
    const match = reaction.message.embeds[0].url.match(/title\/tt(.*)/);
    if (!match || match.lenght < 2) {
      client.logger.warn('No imdbid found');
      return;
    }
    const imdbid = match[1];
    client.logger.debug(imdbid);
    try {
      const result = await api.removeEmoji({
        movieId: imdbid,
        emoji: reaction.emoji.name,
        userId: user.id,
      });
      client.logger.debug(result);
    } catch (error) {
      client.logger.error(error);
    }
  },
};
