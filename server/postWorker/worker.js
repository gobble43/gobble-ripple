const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const processPost = (post, callback) => {
  // get shape with fb id
  // get lat lng with fb id
  // get radius
  callback(null, null);
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
              processPostAsync(task)
                .then((users) => {
                  console.log('added post to these users list: ',
                    users);
                  workerLoop();
                })
                .catch((err) => {
                  console.err(err);
                });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // workerLoop();
};

// start the worker
workerJob();
