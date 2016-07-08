const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const geo = require('../../lib/geo.js');
const collision = require('../../lib/collision.js');

const addPostToUser = (userId, post) => {
  console.log(`adding post: ${post} to user: ${userId}`);
  const maxSavedPosts = 10;
  Promise.all([redisClient.saddAsync(userId, post), redisClient.scardAsync(userId)])
    .then((results) => {
      // keep number of ripple posts under max limit
      if (results[1] > maxSavedPosts) {
        redisClient.spopAsync(userId, results[1] - maxSavedPosts);
      }
    })
    .catch((err) => {
      console.error(`Error adding ripple post to user\'s redis list: ${err}`);
    });
};

const processPost = (post, callback) => {
  // need the post's shape
  redisClient.hgetAsync('shapes', post.userId)
    .then((shape) => {
      // need the post's lat & lng
      return Promise.all([shape, redisClient.zscoreAsync('locations', post.userId)]);
    })
    .then((results) => {
      // decode geohash to get post's lat lng
      const postLocation = geo.decode(results[1], 50);

      // send new ripple to redis queue so socket server can distribute
      // the post to all the connected sockets
      redisClient.lpushAsync('ripples',
        JSON.stringify({ lat: postLocation[0], lng: postLocation[1], shape: results[0] }));

      // get size and shape of post's area
      const size = results[0].split('-')[0];
      const shape = results[0].split('-')[1];

      // get all the points of the polygon in lat & lng
      const shapePoints = collision.getShapePoints(shape, postLocation, size);

      // get the resolution we need to hash the post's lat and lng to
      const resolution = geo.getResolution(size);

      // get the range of geocodes to get all near by users in a certain radius of the post
      let bottomRange = geo.hash(postLocation[0], postLocation[1], resolution);
      let topRange = bottomRange + 1;

      const diff = 50 - resolution;
      for (let i = 0; i < diff; i++) {
        bottomRange *= 2;
        topRange *= 2;
      }

      return Promise.all([shapePoints,
        redisClient.zrangebyscoreAsync('locations', bottomRange, topRange, 'WITHSCORES')]);
    })
    .then((results) => {
      // from all the users in the area, find which ones are actually in the polygon
      const affectedUsers = collision.getAllUsersInPoints(results[0], results[1]);
      callback(null, [affectedUsers, post.postId]);
    })
    .catch((err) => {
      console.error(`Error processing post: ${post}, Error: ${err}`);
      callback(err, null);
    });
};

const processPostAsync = Promise.promisify(processPost);

const workerJob = () => {
  process.on('message', (message) => {
    console.log(`recieved message from the master: ${message}`);
  });

  // process one post at a time
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
            .then((affectedUsersAndPostId) => {
              console.log('addeding post to these user\'s list: ', affectedUsersAndPostId);
              affectedUsersAndPostId[0].forEach((user) => {
                addPostToUser(user, affectedUsersAndPostId[1]);
              });
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
