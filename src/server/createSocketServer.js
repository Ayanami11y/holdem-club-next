const socketio = require('socket.io');
const { registerSocketHandlers } = require('./registerSocketHandlers');

function createSocketServer(server, roomRegistry) {
  const io = socketio(server);
  const services = registerSocketHandlers(io, roomRegistry);
  return {
    io,
    services,
    gameService: services.gameService,
  };
}

module.exports = { createSocketServer };
