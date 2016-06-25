const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const geo = require('../../lib/geo.js');


const processPost = (post, callback) => {
  // get users geocode
  // decode it back to lat and lng

  // find out what resolution the shape is
  // (bottom range) encode users lat and lng at that resolution
  // (top range) bottom range + 1
  // search users with that range to get all possible users
  // get lat and lng of every possible user and userId
  // pass array of points of shape & all users
  // return all userIds in shape
  // add post to add users posts list

  callback(null, post);
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
