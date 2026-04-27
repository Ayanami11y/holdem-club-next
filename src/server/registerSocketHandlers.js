const Game = require('../classes/game.js');
const { sanitizeRoomSettings } = require('./sanitizeRoomSettings');
const { createRoomService } = require('./services/roomService');
const { createGameService } = require('./services/gameService');
const { serializeTable } = require('./serializers/tableSerializer');

function registerSocketHandlers(io, roomRegistry) {
  const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
  const gameService = createGameService(roomRegistry);

  io.on('connection', (socket) => {
    console.log('new connection ', socket.id);

    socket.on('host', (data) => {
      const result = roomService.hostRoom(socket, data);
      if (!result.ok) {
        socket.emit('hostRoom', undefined);
        socket.emit('room:error', { code: result.error, message: '昵称不合法，无法创建牌桌。' });
        return;
      }

      socket.username = data.username;
      result.game.emitPlayers('hostRoom', result.room);
      socket.emit('room:snapshot', result.room);
      socket.emit('table:snapshot', result.room.table);
    });

    socket.on('join', (data) => {
      const result = roomService.joinRoom(socket, data);
      if (!result.ok) {
        socket.emit('joinRoom', undefined);
        socket.emit('room:error', { code: result.error, message: '房间不存在或昵称冲突。' });
        return;
      }

      socket.username = data.username;
      result.game.emitPlayers('joinRoom', result.room);
      result.game.emitPlayers('hostRoom', result.room);
      result.game.emitPlayers('room:snapshot', result.room);
      result.game.players.forEach((player) => {
        player.emit('table:snapshot', serializeTable(result.game, player.getUsername()));
      });
    });

    socket.on('updateRoomSettings', (data, ack) => {
      const result = roomService.updateRoomSettings(socket.id, data);
      if (!result.ok) {
        socket.emit('hostRoomUpdate', undefined);
        socket.emit('room:error', { code: result.error, message: result.message });
        if (typeof ack === 'function') ack({ ok: false, message: result.message });
        return;
      }

      result.game.emitPlayers('hostRoomUpdate', result.room);
      result.game.emitPlayers('hostRoom', result.room);
      result.game.emitPlayers('room:snapshot', result.room);
      if (typeof ack === 'function') ack({ ok: true, settings: result.settings });
    });

    socket.on('startGame', (data) => {
      const result = gameService.startGame(socket.id, data);
      if (!result.ok) {
        socket.emit('gameBegin', undefined);
        socket.emit('game:error', { code: result.error, message: '当前无法开局，请检查人数或房主身份。' });
        return;
      }

      result.game.players.forEach((player) => {
        player.emit('table:snapshot', serializeTable(result.game, player.getUsername()));
      });
    });

    socket.on('evaluatePossibleMoves', () => {
      const result = gameService.evaluatePossibleMoves(socket);
      if (!result.ok) return;
      socket.emit('displayPossibleMoves', result.moves);
      socket.emit('table:snapshot', result.table);
    });

    socket.on('raiseModalData', () => {
      const result = gameService.getRaiseModalData(socket.id);
      if (!result.ok) return;
      socket.emit('updateRaiseModal', result.payload);
    });

    socket.on('startNextRound', () => {
      const result = gameService.startNextRound(socket.id);
      if (!result.ok) return;
      result.game.players.forEach((player) => {
        player.emit('table:snapshot', serializeTable(result.game, player.getUsername()));
      });
    });

    socket.on('moveMade', (data) => {
      const result = gameService.makeMove(socket, data);
      if (!result.ok) {
        socket.emit('game:error', { code: result.error, message: '动作无效或当前牌局不存在。' });
        return;
      }

      result.game.players.forEach((player) => {
        player.emit('table:snapshot', serializeTable(result.game, player.getUsername()));
      });
    });

    socket.on('disconnect', () => {
      gameService.handleDisconnect(socket.id);
    });
  });

  return {
    roomService,
    gameService,
  };
}

module.exports = { registerSocketHandlers };
