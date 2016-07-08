const postController = require('../controllers/postController');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/post', (req, res, next) => {
    if (req.body.task === undefined) {
      return next(new Error('Bad Request: didn\'t supply a task'));
    }
    if (req.body.task === 'post') {
      process.send(req.body);
    }
    res.end();
  });
  app.get('/api/post', (req, res, next) => {
    if (req.query.userId === undefined) {
      return next(new Error('Bad Request: didn\'t supply a user id'));
    }
    postController.getPosts(req.query.userId, res, next);
  });
};
