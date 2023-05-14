/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAIApi, Configuration } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({
  path:
    __dirname +
    '/../../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const callCompletion = async (
  prompt,
  model = 'text-davinci-003',
) => {
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createCompletion({
    model: model,
    prompt: prompt
  });
  const completion_text = completion.data.choices[0].text;
  return completion_text;
};

export const callChatCompletion = async (
  prompt,
  history: Array<any> = [],
  model = 'gpt-3.5-turbo'
) => {
  const openai = new OpenAIApi(configuration);
  const messages: Array<any> = [];
  history.forEach((sample) => {
    messages.push({ role: 'user', content: sample.user });
    messages.push({ role: 'assistant', content: sample.bot });
  });
  messages.push({ role: 'user', content: prompt });
  const completion = await openai.createChatCompletion({
    model: model,
    messages: messages,
  });
  if (completion.data) {
    const firstChoice = completion.data.choices[0];
    if (firstChoice) {
      const completion_text = firstChoice.message?.content;
      return completion_text;
    }
  }
};

export const convertMovieTitleToEmojis = async (movieTitle) => {
  const prompt = `
  Convert movie titles into emojis (some may be french titles).
  use maximum of 5 most relevant emojis.

  Back to the Future => 👨👴🚗🕒 
  Batman => 🤵🦇 
  Transformers => 🚗🤖 
  Star Wars => 🌟🚀🙌
  ${movieTitle} => `;
  //const response = await callChatCompletion(prompt, history);
  const response = await callCompletion(prompt);
  return response || '';
};

export const convertMovieToEmojis = async (title = '', story = '') => {

  const prompt = `Convert movies into emojis.
  
  - Here are some examples of famous movies  when converted to emojis.
  - Please respond with a maximum of 5 most relevant emojis.
  - Use provided resume if you don't know about the movie.

  Exemples:

    Back to the Future => 👨👴🚗🕒 
    Batman => 🤵🦇 
    Transformers => 🚗🤖 
    Star Wars => 🌟🚀🙌
  
  Movie title in french: ${title} 

  Movie resume in french: 
  
    ${story}

  Result:
    ${title} => `;
  //const response = await callChatCompletion(prompt, history);
  const response = await callCompletion(prompt);
  response?.replace(/(\r\n|\n|\r)/gm, '').trim();
  return response || '';
};


