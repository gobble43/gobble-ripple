const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

module.exports = {
  getPosts: (userId, startingPoint, res) => {
    console.log(typeof userId);
    redisClient.smembersAsync(userId)
      .then((posts) => {
        res.end(JSON.stringify(posts));
        // need to get all json contents of posts and return them
      })
      .catch((err) => {
        console.error(err);
        res.end(err);
      });
  },
};
