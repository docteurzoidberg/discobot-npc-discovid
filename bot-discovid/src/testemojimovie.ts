import * as dotenv from 'dotenv';
import * as openai from './lib/openai-gpt';


dotenv.config({
  path:
    __dirname +
    '/../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

(async () => {
  try {
    //ask movie title
    const movieTitle = `captain donkey and the marvelous submarine`;
    const movieStory =
      `
      TODO the donkey, taking his owner to a ship building facility. 
      They get engaged as mechanics and know how to build a submarine.
      As they take a submarine for a routine test, they got swallowed to a magical world under the see and got friends with a siren.
    `;

    const emojis = await openai.convertMovieToEmojis(movieTitle, movieStory);
    console.log(`result: \n${emojis}`);
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
  // `text` is not available here
})();
