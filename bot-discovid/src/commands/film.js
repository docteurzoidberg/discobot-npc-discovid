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

const _formatAutocompleteMovieId = (movie) => {
  if (!movie.title || !movie.imdbId) {
    console.log("Movie doesn't have title or imdbId:", movie);
    return {};
  }
  const movieTitle =
    movie.title.length > 18
      ? movie.title.substring(0, 15) + '...'
      : movie.title;
  return {
    name: `${movie.imdbId.replace('tt', '')}: ${movieTitle} - ${movie.year}`,
    value: movie.imdbId,
  };
};

const _formatAutocompleteMovieTitle = (movie) => {
  if (!movie.title || !movie.imdbId) {
    console.log("Movie doesn't have title or imdbId:", movie);
    return null;
  }
  return {
    name: `${movie.year} > ${movie.title}`,
    value: movie.imdbId,
  };
};

const autocompleteImdbId = async (client, interaction, terms) => {
  const movies = await radarr.lookupMovieImdb(terms);
  const moviesFiltered = removeMoviesWithoutId(movies);
  const moviesOrdered = orderMovieResults(moviesFiltered);
  const moviesLimited = limitResults(moviesOrdered, 5);
  const results = [];
  //iterate over values of object
  for (const movie of Object.values(moviesLimited)) {
    //console.log(movie);
    results.push(_formatAutocompleteMovieId(movie));
  }
  return results;
};

const autocompleteMovieName = async (client, interaction, terms) => {
  const movies = await radarr.lookupMovie(terms);
  const moviesFiltered = removeMoviesWithoutId(movies);
  const moviesOrdered = orderMovieResults(moviesFiltered);
  const moviesLimited = limitResults(moviesOrdered, 5);
  const results = [];
  for (const movie of Object.values(moviesLimited)) {
    const movieTitle = _formatAutocompleteMovieTitle(movie);
    if (movieTitle != null) {
      results.push(movieTitle);
    }
  }
  return results;
};

const orderMovieResults = (movies) => {
  //order results by imdb, tmdb, popularity
  movies.sort((a, b) => {
    if (a.ratings.imdb && b.ratings.imdb) {
      return b.ratings.imdb.value - a.ratings.imdb.value;
    } else if (a.ratings.tmdb && b.ratings.tmdb) {
      return b.ratings.tmdb.value - a.ratings.tmdb.value;
    }
    return b.popularity - a.popularity;
  });
  return movies;
};

const limitResults = (results, limit) => {
  if (results.length > limit) {
    results = results.slice(0, limit);
  }
  return results;
};

const removeMoviesWithoutId = (movies) => {
  return movies.filter((movie) => movie.imdbId && movie.tmdbId);
};

const getColorFromImdbId = (imdbId) => {
  const imdbIdNumber = imdbId.replace('tt', '');
  //generate random color based on imdbId
  const color = parseInt(imdbIdNumber) % 16777215;
  return color;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film')
    .setDescription('Cherche un film!')
    .addStringOption((option) =>
      option
        .setName('film')
        .setDescription('Nom du film (ou id imdb) a chercher')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async execute(client, interaction) {
    //radarr lookup
    const terms = interaction.options.getString('film') || '';

    let imdbId = false;

    //if term contains only numbers, it's an imdbId
    if (terms.match(/^[0-9]+$/) || terms.startsWith('tt')) {
      client.logger.info('terms is an imdbId !');
      imdbId = terms;
    }

    const movies = [];
    try {
      if (imdbId) {
        const result = await radarr.lookupMovieImdb(imdbId);
        if (!result) {
          client.logger.warn(`Aucun resultat par imdb pour ${imdbId}`);
          return interaction.reply({
            content: `Aucun resultat IMDB trouvé pour l'id ${imdbId}`,
            ephemeral: true,
          });
        }
        movies.push(result);
      } else if (terms) {
        const results = await radarr.lookupMovie(terms);
        if (!results || results.length == 0) {
          client.logger.warn(`Aucun resultat radarr pour ${terms}`);
          return interaction.reply({
            content: `Aucun film trouvé pour ${terms}`,
            ephemeral: true,
          });
        }
        //console.log(results);
      }
    } catch (err) {
      client.logger.error(`Erreur lors de la recherche de ${terms}`);
      client.logger.error(err);
      return interaction.reply({
        content: `Erreur lors de la recherche de ${terms}`,
        ephemeral: true,
      });
    }

    //order results by imdb, tmdb, popularity
    const moviesFiltered = removeMoviesWithoutId(movies);
    const moviesOrdered = orderMovieResults(moviesFiltered);

    //fin si aucun film trouvé
    if (moviesOrdered.length == 0) {
      client.logger.warn(`Aucun resultat pour ${terms}`);
      return interaction.reply({
        content: `Aucun film trouvé pour ${terms}`,
        ephemeral: true,
      });
    }

    const result = moviesOrdered[0];
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

    let image = '';
    if (result.images && result.images.length > 0) {
      //look for coverType 'poster'
      const poster = result.images.find((image) => {
        return image.coverType === 'poster';
      });
      if (poster) {
        image = poster.url;
      } else {
        image = result.images[0].url;
      }
    } else if (result.remotePoster) {
      image = result.remotePoster;
    }

    //color generated by random from imdbid from a 256 color palette
    const color = getColorFromImdbId(result.imdbId);

    const movieEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle(result.title)
      .setURL(`http://imdb.com/title/${result.imdbId}`)
      .setDescription(result.overview)
      .setThumbnail(image)
      //.setImage(image)
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

  async autocomplete(client, interaction) {
    //focused option
    const option = interaction.options.getFocused(true);
    if (!option) {
      interaction.respond([]);
    }
    const optionName = option.name;
    const focusedValue = option.value || '';
    let choices = [];
    switch (optionName) {
      case 'film':
        if (focusedValue.length < 3) break;
        choices = await autocompleteMovieName(
          client,
          interaction,
          focusedValue
        );
        console.log(choices);
        break;
      case 'imdb':
        if (focusedValue.length < 5) break;
        choices = await autocompleteImdbId(client, interaction, focusedValue);
        console.log(choices);
        break;
      default:
        break;
    }

    let filterValue = focusedValue.toLowerCase();

    //reduce focusedValue to 24 chars
    //if (filterValue.length > 24) {
    //  filterValue = filterValue.substring(0, 21); //24 - 3 dots
    //  filterValue += '...';
    //}
    const filtered = choices.filter(
      (choice) =>
        //insensitive search
        choice.name &&
        choice.value &&
        choice.name.toLowerCase().indexOf(filterValue) > -1
    );

    //limit to 25 results
    filtered.length = Math.min(filtered.length, 25);

    console.log(filtered);
    await interaction.respond(filtered);
  },
};
