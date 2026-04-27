const { APP_NAME } = require('./config/runtime');
const { createApp } = require('./server/createApp');
const { createRoomRegistry } = require('./server/roomRegistry');
const { createSocketServer } = require('./server/createSocketServer');
const { registerHealthRoutes } = require('./server/healthRoutes');
const { attachRoomStatusRoutes } = require('./server/statusRoutes');

function bootstrap(options = {}) {
  const http = options.http || require('http');
  const port = Number(options.port || process.env.PORT || process.env.BACKEND_PORT || 3001);
  const app = createApp();
  const roomRegistry = createRoomRegistry();
  const server = http.createServer(app);

  registerHealthRoutes(app, {
    getPort: () => port,
    getRoomCount: () => roomRegistry.count(),
  });

  const socketRuntime = createSocketServer(server, roomRegistry);

  attachRoomStatusRoutes(app, {
    getRooms: () => roomRegistry.list(),
    getActivePlayerCount: () => socketRuntime.gameService.getActivePlayerCount(),
  });

  return { app, server, roomRegistry, port, socketRuntime };
}

if (require.main === module) {
  const { server, port } = bootstrap();
  server.listen(port, () => {
    console.log(`${APP_NAME} backend listening on port ${port}`);
  });
}

module.exports = { bootstrap };
