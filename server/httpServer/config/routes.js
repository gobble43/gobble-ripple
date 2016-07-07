const postController = require('../controllers/postController');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/post', (req, res) => {
    if (req.body.task === undefined) {
      res.status(422);
      res.end();
    }
    if (req.body.task === 'post') {
      process.send(req.body);
    }
    res.end();
  });
  app.get('/api/post', (req, res) => {
    if (req.query.userId === undefined) {
      res.status(422);
      res.end();
    }
    postController.getPosts(req.query.userId, res);
  });
};
