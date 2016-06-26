const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const geo = require('../../lib/geo.js');

const getResolution = (size) => {
  if (size === 'small') {
    return 32;
  } else if (size === 'medium') {
    return 27;
  } else if (size === 'large') {
    return 26;
  }
  return 50;
};

const getShapePoints = (shape, center, size) => {
  return [];
};

const getAllUsersInPoints = (points, users) => {
  return [151, 152];
};

const addPostToUser = (userId, post) => {
  Promise.all([redisClient.lpushAsync(userId, post), redisClient.ltrim(userId, 0, 100)])
    .then((results) => {
      console.log(results);
    })
    .catch((err) => {
      console.error(err);
    });
};

const processPost = (post, callback) => {
  redisClient.hgetAsync('shapes', post.userId)
    .then((shape) => {
      // get users geocode
      console.log(shape);
      return Promise.all([shape, redisClient.zscoreAsync('locations', post.userId)]);
    })
    .then((results) => {
      // decode it back to lat and lng
      const postLocation = geo.decode(results[1]);
      const size = results[0].split('-')[0];
      const shape = results[0].split('-')[1];

      const resolution = getResolution(size);
      const shapePoints = getShapePoints(shape, postLocation, size);

      let bottomRange = geo.hash(postLocation[0], postLocation[1], resolution);
      let topRange = bottomRange + 1;
      const diff = 50 - resolution;
      for (let i = 0; i < diff; i++) {
        bottomRange *= 10;
        topRange *= 10;
      }
      return Promise.all([shapePoints,
        redisClient.zrangebyscoreAsync('locations', bottomRange, topRange)]);
    })
    .then((results) => {
      const affectedUsers = getAllUsersInPoints(results[0], results[1]);
      callback(null, affectedUsers);
      affectedUsers.forEach((user) => {
        addPostToUser(user, post.postId);
      });
    })
    .catch((err) => {
      console.error(err);
    });

  // find out what resolution the shape is
  // (bottom range) encode users lat and lng at that resolution
  // (top range) bottom range + 1
  // search users with that range to get all possible users
  // get lat and lng of every possible user and userId
  // pass array of points of shape & all users
  // return all userIds in shape
  // add post to add users posts list
};

const processPostAsync = Promise.promisify(processPost);

const workerJob = () => {
  process.on('message', (message) => {
    console.log('recieved message from the master', message);
  });

  const workerLoop = () => {
    redisClient.llenAsync('posts')
      .then((length) => {
        if (length === 0) {
          setTimeout(workerLoop, 1000);
        } else {
          redisClient.rpopAsync('posts')
            .then((taskString) => {
              console.log(taskString);
              const task = JSON.parse(taskString);
              return processPostAsync(task);
            })
            .then((users) => {
              console.log('added post to these users list: ', users);
              workerLoop();
            })
            .catch((err) => {
              console.error(err);
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
