const socketIO = require('socket.io');
const geo = require('../../../lib/geo.js');

const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

// Start the socket connection server-side
const makeSocketServer = function socketServer(http) {
  const io = socketIO(http);

  // sockets worker job is to distribute new posts to all listening sockets
  const workerJob = () => {
  // process one post at a time
    const workerLoop = () => {
      redisClient.llenAsync('ripples')
        .then((length) => {
          if (length === 0) {
            setTimeout(workerLoop, 1000);
          } else {
            redisClient.rpopAsync('ripples')
              .then((ripple) => {
                io.emit('new ripple', ripple);
                workerLoop();
              })
              .catch((err) => {
                console.error(err);
                workerLoop();
              });
          }
        })
        .catch((err) => {
          console.error(err);
        });
    };
    workerLoop();
  };
  // start the worker
  workerJob();

  io.on('connection', (socket) => {
    const updateUserLocation = function updateUserLocation(userId, lat, lng) {
      const geocode = geo.hash(lat, lng);
      console.log('index.html lat, lng ', lat, lng);
      process.send({ task: 'location', userId, geocode });
    };

    const updateUserShape = function updateUserShape(userId, shape) {
      process.send({ task: 'shape', userId, shape });
    };


    socket.on('update location', updateUserLocation);
    socket.on('update shape', updateUserShape);
  });
};

module.exports = {
  makeSocketServer,
};
