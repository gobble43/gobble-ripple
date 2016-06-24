const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');

module.exports = (app, express) => {
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.resolve(`${__dirname}./../../../dist`)));
};
