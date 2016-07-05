const postController = require('../controllers/postController');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/post', (req, res) => {
    console.log('get posts body', req.body);
    if (req.body.task === 'post') {
      process.send(req.body);
    }
    res.end();
  });
  app.get('/api/post', (req, res) => {
    console.log(req.query);
    postController.getPosts(req.query.userId, req.query.startingPoint, res);
  });
};
