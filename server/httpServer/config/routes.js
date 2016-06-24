
module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.get('/api/posts', (req, res) => {
    console.log('get posts body', req.body);
    process.send(req.body);
    res.end();
  });
};
