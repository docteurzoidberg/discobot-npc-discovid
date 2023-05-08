require('dotenv').config();

const fs = require('fs');

const datapath = process.env.DATA_PATH || '/data';

if(!fs.existsSync(datapath)) {
    fs.mkdirSync(datapath);
}
if(!fs.existsSync(datapath + '/tokens')) {
    fs.mkdirSync(datapath+'/tokens')
}
if(!fs.existsSync(datapath + '/sessions')) {
    fs.mkdirSync(datapath+'/sessions')
}
if(!fs.existsSync(datapath + '/reactions')) {
    fs.mkdirSync(datapath+'/reactions')
}