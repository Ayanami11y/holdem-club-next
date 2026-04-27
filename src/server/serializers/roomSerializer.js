const { serializeTable } = require('./tableSerializer');

function serializeRoom(game) {
  return {
    code: game.getCode(),
    host: game.getHostName(),
    players: game.getPlayersArray(),
    playerCount: game.getPlayersArray().length,
    canStart: game.canStartGame(),
    settings: game.getSettings(),
    table: serializeTable(game),
  };
}

module.exports = {
  serializeRoom,
};
