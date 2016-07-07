const geo = require('./geo.js');

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
    pointsArray.push(geo.addMetersToLatLng(center[1], -radius, center[0], radius));
    // upper right
    pointsArray.push(geo.addMetersToLatLng(center[1], radius, center[0], radius));
    // bottom left
    pointsArray.push(geo.addMetersToLatLng(center[1], -radius, center[0], -radius));
    // bottom right
    pointsArray.push(geo.addMetersToLatLng(center[1], radius, center[0], -radius));
  } else if (shape === 'triangle') {
    // upper right
    pointsArray.push(geo.addMetersToLatLng(center[1], 0, center[0], radius));
    // bottom left
    pointsArray.push(geo.addMetersToLatLng(center[1], -radius, center[0], -radius));
    // bottom right
    pointsArray.push(geo.addMetersToLatLng(center[1], radius, center[1], radius));
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

module.exports = {
  getShapePoints,
  cachePoly,
  isUserInPoints,
  getAllUsersInPoints,
};
