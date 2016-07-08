const cluster = require('cluster');
const redis = require('redis');

const workers = {};

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


    // {task: post, userId: 4323, postId: 4343}
    // {task: location, userID: 2323, geocode: 32828832238}
    // {task: shape, userId: 3232, shape: large-square}
    workers.httpServer.on('message', (message) => {
      console.log('master recieved message from http server', message);
      if (!message.task) {
        console.log('bad task');
        return;
      }

      if (message.task === 'post') {
        console.log('adding a post');
        redisClient.lpush('posts', JSON.stringify(message));
      } else if (message.task === 'location') {
        console.log('adding a location');
        redisClient.zadd('locations', message.geocode, message.userId);
      } else if (message.task === 'shape') {
        console.log('adding a shape');
        redisClient.hset('shapes', message.userId, message.shape);
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
  const masterLoop = () => {
    checkOnHTTPServer();
    checkOnPostWorker();
  };
  masterLoop();
  setInterval(masterLoop, 2000);
};

redisClient = redis.createClient();
redisClient.on('connect', () => {
  console.log('connected to redis');
  masterJob();
});
