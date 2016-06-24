require('babel-polyfill');
const cluster = require('cluster');

const workers = {};
let redisClient;

const checkOnHTTPServer = () => {
  if (workers.httpServer === undefined) {
    console.log('master starting an httpServer');
    workers.httpServer = cluster.fork({ ROLE: 'http server' });

    workers.httpServer.on('online', () => {
      console.log('http server online');
    });
    workers.httpServer.on('exit', () => {
      console.log('http server died');
      delete workers.httpServer;
    });

    // redis cache of shapes for userId
    // redis cache of lat lng for userId for currently logged in users

    // {task: 'post', postId: 4333, userId: 4747 }
    workers.httpServer.on('message', (message) => {
      console.log('master recieved message from http server', message);
      if (!message.task) {
        console.log('bad task');
        return;
      }

      if (message.task === 'post') {
        redisClient.lpush('posts', JSON.stringify(message));
      }
    });
  }
};
const checkOnPostWorker = () => {
  if (workers.postWorker === undefined) {
    console.log('master starting an post worker');
    workers.postWorker = cluster.fork({ ROLE: 'post worker' });

    workers.postWorker.on('online', () => {
      console.log('post worker online');
    });
    workers.postWorker.on('exit', () => {
      console.log('post worker died');
      delete workers.postWorker;
    });

    workers.postWorker.on('message', (message) => {
      console.log('master recieved message from post worker', message);
    });
  }
};

const masterJob = () => {
  console.log('master job started');

  const redis = require('redis');
  redisClient = redis.createClient();
  redisClient.on('connect', () => {
    console.log('connected to redis');

    const masterLoop = () => {
      checkOnHTTPServer();
      checkOnPostWorker();
    };
    masterLoop();
    setInterval(masterLoop, 2000);
  });
};

if (cluster.isMaster) {
  masterJob();
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'post worker') {
  require('./postWorker/worker.js');
}
