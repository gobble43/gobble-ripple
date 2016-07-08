
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');

const errorHandlers = require('./errorHandlers.js');

module.exports = (app, express) => {
  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(express.static(path.resolve(`${__dirname}./../../../dist`)));

  app.use(errorHandlers.logErrors);
  app.use(errorHandlers.clientErrorHandler);
  app.use(errorHandlers.errorHandler);
};
