require('dotenv').config({
  path:
    __dirname +
    '/.env' +
    (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''),
});

const apiApp = require('./api');
const api_port = process.env.API_PORT || 5000;
const hostname = process.env.HOSTNAME || 'localhost';

const fs = require('fs');
const datapath = process.env.DATA_PATH || '/data';

if (!fs.existsSync(datapath)) {
  console.error('Data path does not exist: ' + datapath);
  process.exit(1);
}

apiApp.listen(api_port, () =>
  console.log(
    `discovid-internal-api listening on port http://${hostname}:${api_port}/ !`
  )
);
