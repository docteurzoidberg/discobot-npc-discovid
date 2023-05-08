require('dotenv').config();
const fs = require('fs');
const datapath = process.env.DATA_PATH || '/data';
//reactions: [{user: 'userid', reaction: ':emoji: and or message'},...]

const addReactions = (req, res, next) => {
  const movieId = req.body.movieId;
  const newReactions = req.body.reactions;
  if (!movieId || !newReactions) {
    return res.status(400).end('Bad request');
  }
  try {
    if (!fs.existsSync(datapath + '/reactions/' + movieId + '.json')) {
      fs.writeFileSync(
        datapath + '/reactions/' + movieId + '.json',
        JSON.stringify([])
      );
    }
    //read reactions from file
    const movieReactions = JSON.parse(
      fs.readFileSync(datapath + '/reactions/' + movieId + '.json')
    );
    newReactions.forEach((reaction) => {
      //find if user already reacted
      const reactionIndex = movieReactions.findIndex(
        (r) => r.user.id === reaction.user.id
      );
      //no reaction found for this user
      if (reactionIndex === -1) {
        movieReactions.push(reaction);
      } else {
        //user's reaction found, update his reaction
        if (reaction.reaction)
          movieReactions[reactionIndex].reaction = reaction.reaction;
        if (reaction.emoji) {
          const movieEmoji = movieReactions[reactionIndex].emoji;
          if (movieEmoji) {
            if (
              movieReactions[reactionIndex].emoji.indexOf(reaction.emoji) === -1
            ) {
              movieReactions[reactionIndex].emoji += reaction.emoji;
            }
          } else {
            movieReactions[reactionIndex].emoji = reaction.emoji;
          }
        }
      }
    });
    //write updated movieReactions to file
    fs.writeFileSync(
      datapath + '/reactions/' + movieId + '.json',
      JSON.stringify(movieReactions, null, 2)
    );
    //return updated json
    res.status(200).json(movieReactions);
  } catch (err) {
    console.error(err);
    return res.status(500).end('Internal server error');
  }
};

const removeEmoji = (req, res, next) => {
  const movieId = req.body.movieId;
  const userId = req.body.userId;
  const emoji = req.body.emoji;
  if (!movieId || !emoji || !userId) {
    return res.status(400).end('Bad request');
  }
  try {
    if (!fs.existsSync(datapath + '/reactions/' + movieId + '.json')) {
      fs.writeFileSync(
        datapath + '/reactions/' + movieId + '.json',
        JSON.stringify([])
      );
    }
    //read reactions from file
    const movieReactions = JSON.parse(
      fs.readFileSync(datapath + '/reactions/' + movieId + '.json')
    );

    //find if user already reacted
    const reactionIndex = movieReactions.findIndex((r) => r.user.id === userId);

    //reaction found for this user?
    if (reactionIndex !== -1) {
      const movieReactionEmoji = movieReactions[reactionIndex].emoji;
      //if reaction contains emoji(s), removes the old one from it
      if (movieReactionEmoji) {
        movieReactions[reactionIndex].emoji = movieReactionEmoji.replace(
          emoji,
          ''
        );
      }
    }

    //write updated movieReactions to file
    fs.writeFileSync(
      datapath + '/reactions/' + movieId + '.json',
      JSON.stringify(movieReactions, null, 2)
    );
    //return updated json
    res.status(200).json(movieReactions);
  } catch (err) {
    console.error(err);
    return res.status(500).end('Internal server error');
  }
};

const getReactions = (req, res, next) => {
  const movieId = req.params.movieId;
  const reactions = JSON.parse(
    fs.readFileSync(datapath + '/reactions/' + movieId + '.json')
  );
  res.status(200).json(reactions);
};

module.exports = {
  addReactions,
  getReactions,
  removeEmoji,
};
