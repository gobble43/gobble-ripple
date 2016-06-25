const socketIO = require('socket.io');
const geo = require('./geo.js');

// Start the socket connection server-side
const makeSocketServer = function socketServer(http) {
  const io = socketIO(http);

  io.on('connection', (socket) => {
    const updateUserLocation = function updateUserLocation(userId, lat, lng) {
      const geocode = geo.geoHash(lat, lng);
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
