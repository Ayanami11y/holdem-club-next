const { serializeTable } = require('../serializers/tableSerializer');

function createGameService(roomRegistry) {
  function startGame(socketId, payload) {
    const data = payload || {};
    const game = roomRegistry.findByCode(data.code);

    if (game == undefined || !game.isHostSocket(socketId) || !game.canStartGame()) {
      return { ok: false, error: 'START_REJECTED' };
    }

    game.emitPlayers('gameBegin', { code: data.code });
    game.startGame();
    return { ok: true, game, table: serializeTable(game) };
  }

  function evaluatePossibleMoves(socket) {
    const game = roomRegistry.findBySocketId(socket.id);
    if (!game || !game.roundInProgress) {
      return { ok: false, error: 'NO_ACTIVE_HAND' };
    }

    return {
      ok: true,
      game,
      moves: game.getPossibleMoves(socket),
      table: serializeTable(game, socket.username),
    };
  }

  function getRaiseModalData(socketId) {
    const game = roomRegistry.findBySocketId(socketId);
    if (!game) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }

    return {
      ok: true,
      game,
      payload: {
        topBet: game.getCurrentTopBet(),
        usernameMoney:
          game.getPlayerBetInStage(game.findPlayer(socketId)) +
          game.findPlayer(socketId).getMoney(),
      },
    };
  }

  function startNextRound(socketId) {
    const game = roomRegistry.findBySocketId(socketId);
    if (game != undefined && game.roundInProgress === false) {
      game.startNewRound();
      return { ok: true, game, table: serializeTable(game) };
    }

    return { ok: false, error: 'ROUND_STILL_RUNNING' };
  }

  function makeMove(socket, payload) {
    const data = payload || {};
    const game = roomRegistry.findBySocketId(socket.id);

    if (game == undefined) {
      return { ok: false, error: 'GAME_NOT_FOUND' };
    }

    const player = game.findPlayer(socket.id);
    if (!player || player.socket.id !== socket.id) {
      return { ok: false, error: 'PLAYER_NOT_FOUND' };
    }

    if (!game.roundInProgress) {
      return { ok: false, error: 'NO_ACTIVE_HAND' };
    }

    if (game.roundData.turn !== player.getUsername() || player.getStatus() !== 'Their Turn') {
      return { ok: false, error: 'NOT_PLAYER_TURN' };
    }

    let acted = false;
    if (data.move == 'fold') {
      acted = game.fold(socket);
    } else if (data.move == 'check') {
      acted = game.check(socket);
    } else if (data.move == 'bet') {
      acted = game.bet(socket, data.bet);
    } else if (data.move == 'call') {
      acted = game.call(socket);
    } else if (data.move == 'raise') {
      acted = game.raise(socket, data.bet);
    } else {
      return { ok: false, error: 'INVALID_MOVE' };
    }

    if (acted !== true) {
      return { ok: false, error: 'ILLEGAL_ACTION' };
    }

    return { ok: true, game, table: serializeTable(game, socket.username) };
  }

  function handleDisconnect(socketId) {
    const game = roomRegistry.findBySocketId(socketId);
    if (game == undefined) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }

    const player = game.findPlayer(socketId);
    game.disconnectPlayer(player);
    if (game.players.length === 0) {
      roomRegistry.remove(game);
    }

    return { ok: true, game };
  }

  function getActivePlayerCount() {
    return roomRegistry.list().reduce((acc, game) => acc + game.players.length, 0);
  }

  return {
    startGame,
    evaluatePossibleMoves,
    getRaiseModalData,
    startNextRound,
    makeMove,
    handleDisconnect,
    getActivePlayerCount,
  };
}

module.exports = {
  createGameService,
};
