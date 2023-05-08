require('dotenv').config({
  path:
    `${__dirname}/../../.env` +
    (process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''),
});

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} = require('@discordjs/builders');

const { ButtonStyle } = require('discord.js');
const MovieDB = require('node-themoviedb');
const crypto = require('crypto');

const api = require('../lib/api');
const radarr = require('../lib/radarr');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const tmdb = new MovieDB(TMDB_API_KEY, { language: 'fr-FR' });

//'👍', '👎' buttons
const makeUniqueThumbsUpButton = (client, movieResult, interaction) => {
  const randomId = crypto.randomBytes(20).toString('hex');
  const buttonId = `thumbsup-' + ${movieResult.imdbId} + '-' + ${randomId}`;
  const uniqueThumbsUpButtonFilter = (filterInteraction) =>
    filterInteraction.isButton() && filterInteraction.customId == buttonId;
  const uniqueThumbsUpButtonCollector =
    interaction.channel.createMessageComponentCollector({
      filter: uniqueThumbsUpButtonFilter,
    });
  uniqueThumbsUpButtonCollector.on('collect', async (collectorInteraction) => {
    return await thumbsUpButtonInterractionCollector(
      client,
      movieResult,
      uniqueThumbsUpButtonCollector,
      collectorInteraction
    );
  });
  uniqueThumbsUpButtonCollector.on('end', (collected) =>
    client.logger.debug(`Collected ${collected.size} items`)
  );

  const thumbsUpButton = new ButtonBuilder()
    .setCustomId(buttonId)
    .setLabel('👍')
    //.setEmoji('👍')
    .setStyle(ButtonStyle.Secondary);

  return thumbsUpButton;
};

const thumbsUpButtonInterractionCollector = async (
  client,
  result,
  collector,
  interaction
) => {
  client.logger.info('Thumbs up');
  const imdbId = result.imdbId.replace('tt', '');
  const reaction = { user: interaction.user, emoji: '👍' };
  try {
    await api.addReactions({
      movieId: imdbId,
      reactions: [reaction],
    });
    api.removeEmoji({
      movieId: imdbId,
      userId: interaction.user.id,
      emoji: '👎',
    });
    interaction.channel.send({
      content: `${interaction.user.username}> Merci pour l'avis, c'est noté !`,
      ephemeral: true,
    });
  } catch (error) {
    client.logger.error(error);
  }
};

const makeUniqueThumbsDownButton = (client, movieResult, interaction) => {
  const randomId = crypto.randomBytes(20).toString('hex');
  const buttonId = `thumbsdown-' + ${movieResult.imdbId} + '-' + ${randomId}`;
  const uniqueThumbsDownButtonFilter = (filterInteraction) =>
    filterInteraction.isButton() && filterInteraction.customId == buttonId;
  const uniqueThumbsDownButtonCollector =
    interaction.channel.createMessageComponentCollector({
      filter: uniqueThumbsDownButtonFilter,
    });
  uniqueThumbsDownButtonCollector.on(
    'collect',
    async (collectorInteraction) => {
      return await thumbsDownButtonInterractionCollector(
        client,
        movieResult,
        uniqueThumbsDownButtonCollector,
        collectorInteraction
      );
    }
  );
  uniqueThumbsDownButtonCollector.on('end', (collected) =>
    client.logger.debug(`Collected ${collected.size} items`)
  );

  const thumbsDownButton = new ButtonBuilder()
    .setCustomId(buttonId)
    .setLabel('👎')
    //.setEmoji('👎')
    .setStyle(ButtonStyle.Secondary);

  return thumbsDownButton;
};

const thumbsDownButtonInterractionCollector = async (
  client,
  result,
  collector,
  interaction
) => {
  client.logger.info('Thumbs down');
  const imdbId = result.imdbId.replace('tt', '');
  const reaction = { user: interaction.user, emoji: '👎' };
  try {
    await api.addReactions({
      movieId: imdbId,
      reactions: [reaction],
    });
    api.removeEmoji({
      movieId: imdbId,
      userId: interaction.user.id,
      emoji: '👍',
    });
    interaction.channel.send({
      content: `${interaction.user.username}> Merci pour l'avis, c'est noté !`,
      ephemeral: true,
    });
  } catch (error) {
    client.logger.error('Error while adding reaction');
    client.logger.error(error);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film')
    .setDescription('Cherche un film!')
    .addStringOption((option) =>
      option.setName('film').setDescription('Nom du film a chercher')
    ),

  async execute(client, interaction) {
    //radarr lookup
    const terms = interaction.options.getString('film');
    const movies = [];
    try {
      const results = await radarr.lookupMovie(terms);
      if (!results || results.length == 0) {
        client.logger.warn(`Aucun film trouvé pour ${terms}`);
        return interaction.reply({
          content: `Aucun film trouvé pour ${terms}`,
          ephemeral: true,
        });
      }
      for (const result of results) {
        //const movie = await tmdb.getMovie(result.tmdbId);
        movies.push(result);
      }
    } catch (err) {
      client.logger.error(`Erreur lors de la recherche de ${terms}`);
      client.logger.error(err);
      return interaction.reply({
        content: `Erreur lors de la recherche de ${terms}`,
        ephemeral: true,
      });
    }

    const result = movies[0];
    client.logger.debug(result);

    //'👍', '👎' buttons
    const thumbsUpButton = makeUniqueThumbsUpButton(
      client,
      result,
      interaction
    );

    const thumbsDownButton = makeUniqueThumbsDownButton(
      client,
      result,
      interaction
    );

    const row = new ActionRowBuilder().addComponents(
      thumbsUpButton,
      thumbsDownButton
    );

    // Message Fields
    var fields = [];

    if (result.genres && result.genres.length > 0) {
      fields.push({
        name: 'Genre',
        value: result.genres.join(', '),
        inline: true,
      });
    }
    if (result.year && result.year.toString() !== '') {
      fields.push({
        name: 'Année',
        value: result.year.toString(),
        inline: true,
      });
    }
    if (result.studio && result.studio !== '') {
      fields.push({ name: 'Studio', value: result.studio, inline: true });
    }

    //more fields: tmdb more info
    try {
      const args = {
        pathParameters: {
          movie_id: result.tmdbId,
        },
      };
      const movieTmdb = await tmdb.movie.getCredits(args);

      const director = movieTmdb.data.crew.find((crew) => {
        return crew.job === 'Director';
      });

      const actors = movieTmdb.data.cast.map((cast) => {
        return cast.name;
      });

      //limit to 3 actors
      const actorsLimited = actors.slice(0, 3);

      if (director?.name !== '') {
        fields.push({
          name: 'Réalisateur',
          value: director.name,
          inline: true,
        });
      }
      if (actorsLimited.length > 0) {
        fields.push({
          name: 'Acteurs',
          value: actorsLimited.join(', '),
          inline: true,
        });
      }
    } catch (error) {
      client.logger.error(error);
    }

    const movieEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(result.title)
      .setURL(`http://imdb.com/title/${result.imdbId}`)
      .setDescription(result.overview)
      .setThumbnail(result.remotePoster)
      .addFields(fields);

    //Actual response to command
    const msg = await interaction.reply({
      content: `Film: ${result.title}`,
      embeds: [movieEmbed],
      components: [row],
      ephemeral: false,
      fetchReply: true,
    });

    //Another message if reactions
    try {
      const reactions = await api.getReactions({
        movieId: result.imdbId.replace('tt', ''),
      });
      if (reactions && reactions.length > 0) {
        const reactionsContent = [];
        reactions.forEach((reaction) => {
          if (reaction.emoji && reaction.reaction) {
            reactionsContent.push(
              `${reaction.emoji} "${reaction.reaction}" -${reaction.user.username}`
            );
          } else if (reaction.reaction) {
            reactionsContent.push(
              `"${reaction.reaction}" -${reaction.user.username}`
            );
          } else if (reaction.emoji) {
            reactionsContent.push(
              `${reaction.emoji} -${reaction.user.username}`
            );
          }
        });
        msg.channel.send({
          content: reactionsContent.join('\n'),
          ephemeral: false,
          fetchReply: false,
        });
      }
    } catch (error) {
      client.logger.error('Error getting reactions from api');
      client.logger.error(error);
    }
  },
};
