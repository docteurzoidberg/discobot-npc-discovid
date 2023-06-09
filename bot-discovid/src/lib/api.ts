import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({
  path:
    __dirname +
    '/../../.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

const API_URL = process.env.API_URL || 'http://localhost:5000';

export async function addLink(ctx) {
  return axios
    .post(`${API_URL}/links/add`, ctx, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}

export async function addReactions(ctx) {
  return axios
    .post(`${API_URL}/reactions/add`, ctx, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}

export async function removeEmoji(ctx) {
  return axios
    .post(`${API_URL}/reactions/removeEmoji`, ctx, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}

export async function getReactions(ctx) {
  return axios
    .get(`${API_URL}/reactions/get/${ctx.movieId}`, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}
