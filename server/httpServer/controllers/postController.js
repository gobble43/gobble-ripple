const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const fetchUtils = require('./../config/fetch-utils.js');

// Load environment variables
const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: './env/development.env' });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: './env/production.env' });
}

const fetch = require('isomorphic-fetch');
const gobbleDBUrl = process.env.GOBBLE_DB_URL;

module.exports = {
  getPosts: (userId, res, next) => {
    redisClient.smembersAsync(userId)
      .then((posts) => {
        fetch(`${gobbleDBUrl}/db/postsById?posts=${JSON.stringify(posts)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
        .then(response => {
          return fetchUtils.checkStatus(response);
        })
        .then(response => {
          res.end(JSON.stringify(response));
        })
        .catch(() => {
          return next(new Error(`Error getting ripple posts from gobble-db for user: ${userId}`));
        });
      })
      .catch(() => {
        return next(new Error(`Error getting ripple posts ids for user: ${userId}`));
      });
  },
};
