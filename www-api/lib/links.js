require('dotenv').config();

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const datapath = process.env.DATA_PATH || '/data';

//generate link id from random 21 characters string
const generateLinkId = () => {
  return uuidv4();
};

//get links
const getLinks = (req, res) => {
  try {
    const links = JSON.parse(fs.readFileSync(datapath + '/links.json', 'utf8'));
    res.json(links || []);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

//add link
const addLink = (req, res) => {
  try {
    const links = JSON.parse(fs.readFileSync(datapath + '/links.json', 'utf8'));
    if (!links) links = [];
    var link = req.body;
    if (!link.file) throw new Error('No file');
    if (!link.name) throw new Error('No name');
    if (!link.type) throw new Error('No type');
    if (!link.size) throw new Error('No size');
    link.id = generateLinkId();
    links.push(link);
    fs.writeFileSync(datapath + '/links.json', JSON.stringify(links));
    res.json(link);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

//get link by id
const getLink = (req, res) => {
  try {
    const links = JSON.parse(fs.readFileSync(datapath + '/links.json', 'utf8'));
    const link = links.find((l) => l.id === req.params.id);
    res.json(link);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

//delete link
const deleteLink = (req, res) => {
  try {
    const links = JSON.parse(fs.readFileSync(datapath + '/links.json', 'utf8'));
    const link = links.find((l) => l.id === req.params.id);
    links.splice(links.indexOf(link), 1);
    fs.writeFileSync(datapath + '/links.json', JSON.stringify(links));
    res.json(links);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

//download link file
const downloadFile = (req, res) => {
  try {
    const links = JSON.parse(fs.readFileSync(datapath + '/links.json', 'utf8'));
    const link = links.find((l) => l.id === req.params.id);
    res.download(link.file);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

module.exports = {
  getLinks,
  addLink,
  getLink,
  deleteLink,
  downloadFile,
};
