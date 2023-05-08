const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const reactions = require('./lib/reactions');
const links = require('./lib/links');
const middlewares = require('./middlewares');

const app = express();

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', middlewares.noIndexHandler);
app.get('/reactions/get/:movieId', reactions.getReactions);
app.post('/reactions/add', reactions.addReactions);
app.post('/reactions/removeEmoji', reactions.removeEmoji);
app.post('/links/add', links.addLink);
app.get('/links/get', links.getLinks);
app.get('/links/get/:id', links.getLink);
app.delete('/links/delete/:id', links.deleteLink);
app.use(middlewares.notFoundHandler);
app.use(middlewares.errorHandler);

module.exports = app;
