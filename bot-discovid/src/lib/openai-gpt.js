require('dotenv').config({
  path:
    __dirname +
    '/../../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || false,
});

const convertMovieTitleToEmojis = async (movieTitle) => {
  const prompt = `Convert movie title into emojis (some may be french titles).
  Back to the Future => 👨👴🚗🕒 
  Batman => 🤵🦇 
  Transformers => 🚗🤖 
  Star Wars => 🌟🚀🙌
  
  Now here is the movie title: ${movieTitle} 
  (please respond only with emojis)
`;
  const history = [];
  const response = await callOpenAi(prompt, history);

  //if response containe anything other than emoji. removes it
  //const regex = /[^a-zA-Z0-9]/g;
  //const responseWithoutAlphaChars = response.replace(regex, '');

  //console.log(response);

  //keep only the last line
  //const lines = response.split('\n');
  //const lastLine = lines[lines.length - 1];
  //console.log(lastLine);

  return response;
};

const callOpenAi = async (prompt, history = [], model = 'gpt-3.5-turbo') => {
  const openai = new OpenAIApi(configuration);
  const messages = [];

  history.forEach((sample) => {
    messages.push({ role: 'user', content: sample.user });
    messages.push({ role: 'assistant', content: sample.bot });
  });

  messages.push({ role: 'user', content: prompt });
  try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: messages,
    });
    const completion_text = completion.data.choices[0].message.content;
    return completion_text;
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
};

module.exports = {
  callOpenAi,
  convertMovieTitleToEmojis,
};
