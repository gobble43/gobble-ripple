const Promise = require('bluebird');
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient();

const geo = require('../../lib/geo.js');

// get geohahing bit length / resolution for given radius in meters
const getResolution = (size) => {
  if (size === 'small') {
    return 35; // 50m x 50m box
  } else if (size === 'medium') {
    return 30; // 300m x 300m box
  } else if (size === 'large') {
    return 25; // 2km x 2km box
  }
  return 50;
};

const addMetersToLatLng = (lng, dx, lat, dy) => {
  const radiusOfEarth = 6371000;
  const newLat = lat + (dy / radiusOfEarth) * (180 / Math.PI);
  const newLng = lng + (dx / radiusOfEarth) * (180 / Math.PI / Math.cos(lat * Math.PI / 180));
  return [newLat, newLng];
};

// get all points of a polygon bases on a center point size and shape
const getShapePoints = (shape, center, size) => {
  const pointsArray = [];
  let radius = 0;
  if (size === 'small') {
    radius = 25;
  } else if (size === 'medium') {
    radius = 150;
  } else if (size === 'large') {
    radius = 1000;
  }
  if (shape === 'square') {
    // upper left
    pointsArray.push(addMetersToLatLng(center[1], -radius, center[0], radius));
    // upper right
    pointsArray.push(addMetersToLatLng(center[1], radius, center[0], radius));
    // bottom left
    pointsArray.push(addMetersToLatLng(center[1], -radius, center[0], -radius));
    // bottom right
    pointsArray.push(addMetersToLatLng(center[1], radius, center[0], -radius));
  } else if (shape === 'triangle') {
    // upper right
    pointsArray.push(addMetersToLatLng(center[1], 0, center[0], radius));
    // bottom left
    pointsArray.push(addMetersToLatLng(center[1], -radius, center[0], -radius));
    // bottom right
    pointsArray.push(addMetersToLatLng(center[1], radius, center[1], radius));
  }
  return pointsArray;
};

// used for optimization since we are using the same set of points everytime
const cachePoly = (polyPoints) => {
  const constant = [];
  const multiple = [];
  let j = polyPoints.length - 1;
  for (let i = 0; i < polyPoints.length; i++) {
    if (polyPoints[j][0] === polyPoints[i][0]) {
      constant[i] = polyPoints[i][1];
      multiple[i] = 0;
    } else {
      constant[i] = polyPoints[i][1] - (polyPoints[i][0] * polyPoints[j][1]) /
        (polyPoints[j][0] - polyPoints[i][0]) + (polyPoints[i][0] * polyPoints[i][1]) /
        (polyPoints[j][0] - polyPoints[i][0]);
      multiple[i] = (polyPoints[j][1] - polyPoints[i][1]) / (polyPoints[j][0] - polyPoints[i][0]);
    }
    j = i;
  }
  return [constant, multiple];
};

// find if one user is inside the polygon
const isUserInPoints = (user, points, constant, multiple) => {
  let j = points.length - 1;
  let inside = true;
  const userLocation = geo.decode(user);
  for (let i = 0; i < points.length; i++) {
    if ((points[i][0] < userLocation[0] && points[j][0] >= userLocation[0]
      || points[j][0] < userLocation[0] && points[i][0] >= userLocation[0])) {
      inside ^= (userLocation[0] * multiple[i] + constant[i] < userLocation[1]);
    }
    j = i;
  }
  return inside;
};

// find all the users inside the points of a certain polygon
const getAllUsersInPoints = (points, users) => {
  const affectedUsers = [];
  const cashedPoly = cachePoly(points);
  for (let i = 0; i < users.length; i += 2) {
    if (isUserInPoints(users[i + 1], points, cashedPoly[0], cashedPoly[1])) {
      affectedUsers.push(users[i]);
    }
  }
  return affectedUsers;
};

const addPostToUser = (userId, post) => {
  const maxSavedPosts = 10;
  Promise.all([redisClient.saddAsync(userId, post), redisClient.scardAsync(userId)])
    .then((results) => {
      console.log(results);
      // keep number of ripple posts under max limit
      if (results[1] > maxSavedPosts) {
        redisClient.spopAsync(userId, results[1] - maxSavedPosts);
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

const processPost = (post, callback) => {
  console.log('post currently being processed: ', post);
  // need the post's shape
  redisClient.hgetAsync('shapes', post.userId)
    .then((shape) => {
      console.log('posts shape: ', shape);
      // need the post's lat & lng
      return Promise.all([shape, redisClient.zscoreAsync('locations', post.userId)]);
    })
    .then((results) => {
      // decode geohash to get post's lat lng
      const postLocation = geo.decode(results[1], 50);
      console.log('post\'s location: ', postLocation);

      // send new ripple to redis queue so socket server can distribute
      // the post to all the connected sockets
      redisClient.lpushAsync('ripples',
        JSON.stringify({ lat: postLocation[0], lng: postLocation[1], shape: results[0] }));

      // get size and shape of post's area
      const size = results[0].split('-')[0];
      const shape = results[0].split('-')[1];

      // get all the points of the polygon in lat & lng
      const shapePoints = getShapePoints(shape, postLocation, size);
      console.log('post\'s points: ', shapePoints);

      // get the resolution we need to hash the post's lat and lng to
      const resolution = getResolution(size);
      console.log('post\'s resolution: ', resolution);

      // get the range of geocodes to get all near by users in a certain radius of the post
      let bottomRange = geo.hash(postLocation[0], postLocation[1], resolution);
      let topRange = bottomRange + 1;

      const diff = 50 - resolution;
      for (let i = 0; i < diff; i++) {
        bottomRange *= 2;
        topRange *= 2;
      }

      console.log('bottom range', bottomRange);
      console.log('top range', topRange);

      return Promise.all([shapePoints,
        redisClient.zrangebyscoreAsync('locations', bottomRange, topRange, 'WITHSCORES')]);
    })
    .then((results) => {
      // from all the users in the area, find which ones are actually in the polygon
      const affectedUsers = getAllUsersInPoints(results[0], results[1]);
      callback(null, affectedUsers);
      affectedUsers.forEach((user) => {
        addPostToUser(user, post.postId);
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

const processPostAsync = Promise.promisify(processPost);

const workerJob = () => {
  process.on('message', (message) => {
    console.log('recieved message from the master', message);
  });

  // process posts one at a time
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
