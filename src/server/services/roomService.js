const { serializeRoom } = require('../serializers/roomSerializer');

function createRoomService(roomRegistry, Game, sanitizeRoomSettings) {
  function hostRoom(socket, payload) {
    const data = payload || {};
    if (data.username == '' || data.username == undefined || data.username.length > 12) {
      return { ok: false, error: 'INVALID_USERNAME' };
    }

    let code;
    do {
      code =
        '' +
        Math.floor(Math.random() * 10) +
        Math.floor(Math.random() * 10) +
        Math.floor(Math.random() * 10) +
        Math.floor(Math.random() * 10);
    } while (roomRegistry.count() !== 0 && roomRegistry.list().some((room) => room.getCode() === code));

    const game = new Game(code, data.username);
    game.configureSettings(sanitizeRoomSettings(data.settings));
    roomRegistry.add(game);
    game.addPlayer(data.username, socket);

    return { ok: true, game, room: serializeRoom(game) };
  }

  function joinRoom(socket, payload) {
    const data = payload || {};
    const game = roomRegistry.findByCode(data.code);

    if (
      game == undefined ||
      game.getPlayersArray().some((player) => player == data.username) ||
      data.username == undefined ||
      data.username.length > 12
    ) {
      return { ok: false, error: 'JOIN_REJECTED' };
    }

    game.addPlayer(data.username, socket);
    roomRegistry.replace(game);

    return { ok: true, game, room: serializeRoom(game) };
  }

  function updateRoomSettings(socketId, payload) {
    const data = payload || {};
    const game = roomRegistry.findByCode(data.code);

    if (game == undefined || !game.isHostSocket(socketId)) {
      return {
        ok: false,
        error: 'NOT_HOST',
        message: '你不是当前房主，无法修改房间设置。',
      };
    }

    game.configureSettings(sanitizeRoomSettings(data.settings));
    return { ok: true, game, room: serializeRoom(game), settings: game.getSettings() };
  }

  return {
    hostRoom,
    joinRoom,
    updateRoomSettings,
  };
}

module.exports = {
  createRoomService,
};
