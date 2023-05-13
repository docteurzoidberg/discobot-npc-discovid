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

const callCompletion = async (
  prompt,
  model = 'davinci-003',
  temperature = 0.9,
  stop = ['\n']
) => {
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createCompletion({
    model: model,
    prompt: prompt,
    temperature: temperature,
    stop: stop,
  });
  const completion_text = completion.data.choices[0].text;
  return completion_text;
};

const callChatCompletion = async (
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

module.exports = {
  callCompletion,
  callChatCompletion,
};
