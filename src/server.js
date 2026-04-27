const { APP_NAME } = require('./config/runtime');
const { bootstrap } = require('./app');

const { server, port } = bootstrap();

server.listen(port, () => {
  console.log(`${APP_NAME} backend listening on port ${port}`);
});
