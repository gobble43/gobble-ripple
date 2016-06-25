
module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/post', (req, res) => {
    console.log('get posts body', req.body);
    req.body.task = 'post';
    process.send(req.body);
    res.end();
  });
};
