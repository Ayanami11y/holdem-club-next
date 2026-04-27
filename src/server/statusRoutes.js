const { serializeTable } = require('./serializers/tableSerializer');

function attachRoomStatusRoutes(app, options) {
  const getRooms = options.getRooms;
  const getActivePlayerCount = options.getActivePlayerCount;

  app.get('/api/status', (_req, res) => {
    const rooms = getRooms().map((game) => ({
      code: game.getCode(),
      host: game.getHostName(),
      playerCount: game.players.length,
      canStart: game.canStartGame(),
      roundInProgress: Boolean(game.roundInProgress),
      table: serializeTable(game),
    }));

    res.json({
      ok: true,
      rooms,
      roomCount: rooms.length,
      activePlayers: getActivePlayerCount(),
    });
  });
}

module.exports = { attachRoomStatusRoutes };
