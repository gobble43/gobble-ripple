require('babel-polyfill');
const cluster = require('cluster');

if (cluster.isMaster) {
  require('./master.js');
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'post worker') {
  require('./postWorker/worker.js');
}
