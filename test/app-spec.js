require('./setup');

const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const geo = require('./../lib/geo.js');
// const collision = require('./../lib/collision.js');

const expect = require('chai').expect;

const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
console.log(appUrl);
const request = require('supertest');

describe('Gobble Ripple', () => {
  describe('Test Endpoints', () => {
    it('index should return status code 200', (done) => {
      request(appUrl)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
    it('/api/post get request should return status code 422 for bad parameters', (done) => {
      request(appUrl)
        .get('/api/post')
        .set('Accept', 'application/json')
        .expect(422)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
    it('/api/post post request should return status code 422 for bad parameters', (done) => {
      request(appUrl)
        .post('/api/post')
        .set('Accept', 'application/json')
        .expect(422)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
    it('/api/post post request should return status code 200 for good request', (done) => {
      request(appUrl)
        .post('/api/post')
        .send({ task: 'post', userId: 1, postId: 78 })
        .set('Accept', 'application/json')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
  });
  describe('Test Geo Libarary', () => {
    it('should properly hash a lat & lng into a geocode', () => {
      expect(geo.hash(50, 50)).to.equal(950519344430599);
    });
    it('should properly decode geohash back into lat lng', () => {
      expect(Math.round(geo.decode(950519344430599)[0])).to.equal(50);
      expect(Math.round(geo.decode(950519344430599)[1])).to.equal(50);
    });
    it('should properly add meters to lat & lng', () => {
      expect(geo.addMetersToLatLng(50, 10, 50, 10)[0]).to.equal(50.00008993216059);
      expect(geo.addMetersToLatLng(50, 10, 50, 10)[1]).to.equal(50.00013990960503);
    });
  });

  describe('Test Add New Post', () => {
    // add two users
    it('should add post to users ripple lists in the area of the poster\'s shape', (done) => {
      Promise.all([redisClient.zaddAsync('locations', 341156730837933, 1),
        redisClient.hsetAsync('shapes', 1, 'large-square'),
        redisClient.zaddAsync('locations', 341156730837933, 2),
        redisClient.hsetAsync('shapes', 2, 'large-square')])
        .then(() => {
          // add new post
          redisClient.lpushAsync('posts', JSON.stringify({ userId: 1, postId: 50 }));
        })
        .catch((err) => {
          console.error(err);
        });
      setTimeout(() => {
        redisClient.smembersAsync(2)
          .then((posts) => {
            done();
            expect(posts.indexOf('50')).to.not.equal(-1);
          })
          .catch((err) => {
            console.error(err);
          });
      }, 1500);
    });

    it('should not add post to users ripple lists if they aren\'t in the range of the poster\'s shape', (done) => {
      Promise.all([redisClient.zaddAsync('locations', 341156000000000, 3),
        redisClient.hsetAsync('shapes', 3, 'large-square'),
        redisClient.zaddAsync('locations', 111111111111111, 4),
        redisClient.hsetAsync('shapes', 4, 'large-square')])
        .then(() => {
          // add new post
          redisClient.lpushAsync('posts', JSON.stringify({ userId: 3, postId: 100 }));
        })
        .catch((err) => {
          console.error(err);
        });
      setTimeout(() => {
        redisClient.smembersAsync(4)
          .then((posts) => {
            done();
            expect(posts.indexOf('100')).to.equal(-1);
          })
          .catch((err) => {
            console.error(err);
          });
      }, 1500);
    });
  });
});
