import * as dotenv from 'dotenv';
import * as openai from './lib/openai-gpt';
import * as readline from 'readline';

dotenv.config({
  path:
    __dirname +
    '/../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

(async () => {
  try {
    //ask movie title
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const question = (query) =>
      new Promise((resolve) => rl.question(query, resolve));
    const movietitle = await question('Titre du film: ');
    rl.close();
    // Deal with the fact the chain failed

    //ask movie title
    const emojis = await openai.convertMovieTitleToEmojis(movietitle);
    console.log(emojis);
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
  // `text` is not available here
})();
