const events = require('events');
const Game = require('../../src/classes/game.js');
const { createRoomRegistry } = require('../../src/server/roomRegistry');
const { createRoomService } = require('../../src/server/services/roomService');
const { createGameService } = require('../../src/server/services/gameService');
const { registerSocketHandlers } = require('../../src/server/registerSocketHandlers');
const { sanitizeRoomSettings } = require('../../src/server/sanitizeRoomSettings');
const { serializeTable } = require('../../src/server/serializers/tableSerializer');

function createSocket(id) {
  const socket = new events.EventEmitter();
  socket.id = id;
  socket.emitted = [];
  const originalEmit = socket.emit.bind(socket);
  socket.emit = (eventName, payload) => {
    socket.emitted.push({ eventName, payload });
    return originalEmit(eventName, payload);
  };
  return socket;
}

function getCurrentTurnPlayer(game) {
  return game.players.find((player) => player.getUsername() === game.roundData.turn);
}

describe('room/game service large-table flows', () => {
  test('only the active player can make a move through gameService', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;
    const secondSocket = createSocket(2);
    expect(roomService.joinRoom(secondSocket, { code, username: 'villain' }).ok).toBe(true);

    expect(gameService.startGame(hostSocket.id, { code }).ok).toBe(true);
    const game = roomRegistry.findByCode(code);
    const currentTurnPlayer = getCurrentTurnPlayer(game);
    const waitingPlayer = game.players.find((player) => player.getUsername() !== currentTurnPlayer.getUsername());

    const result = gameService.makeMove(waitingPlayer.socket, { move: 'call' });
    expect(result).toMatchObject({ ok: false, error: 'NOT_PLAYER_TURN' });
  });

  test('rejects impossible bet sizes instead of silently accepting them', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;
    expect(roomService.joinRoom(createSocket(2), { code, username: 'p2' }).ok).toBe(true);
    expect(roomService.joinRoom(createSocket(3), { code, username: 'p3' }).ok).toBe(true);

    expect(gameService.startGame(hostSocket.id, { code }).ok).toBe(true);
    const game = roomRegistry.findByCode(code);
    const currentTurnPlayer = getCurrentTurnPlayer(game);
    const topBet = game.getCurrentTopBet();
    const playerBet = game.getPlayerBetInStage(currentTurnPlayer);
    expect(topBet).toBeGreaterThan(playerBet);

    const illegalBet = gameService.makeMove(currentTurnPlayer.socket, { move: 'bet', bet: 1 });
    expect(illegalBet).toMatchObject({ ok: false, error: 'ILLEGAL_ACTION' });
    expect(game.roundData.turn).toBe(currentTurnPlayer.getUsername());

    const legalMove = gameService.makeMove(currentTurnPlayer.socket, { move: 'call' });
    expect(legalMove.ok).toBe(true);
  });

  test('allows a room to fill to eleven players and start from host socket only', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    expect(hostResult.ok).toBe(true);

    const code = hostResult.room.code;
    for (let i = 2; i <= 11; i++) {
      const joinResult = roomService.joinRoom(createSocket(i), {
        code,
        username: `p${i}`,
      });
      expect(joinResult.ok).toBe(true);
    }

    const game = roomRegistry.findByCode(code);
    expect(game.players.length).toBe(11);

    const nonHostStart = gameService.startGame(9999, { code });
    expect(nonHostStart.ok).toBe(false);

    const hostStart = gameService.startGame(hostSocket.id, { code });
    expect(hostStart.ok).toBe(true);
    expect(hostStart.game.roundInProgress).toBe(true);
  });

  test('removes disconnected players from registry-backed active counts', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;

    const sockets = [hostSocket];
    for (let i = 2; i <= 11; i++) {
      const socket = createSocket(i);
      sockets.push(socket);
      expect(roomService.joinRoom(socket, { code, username: `p${i}` }).ok).toBe(true);
    }

    expect(gameService.getActivePlayerCount()).toBe(11);
    expect(gameService.handleDisconnect(sockets[10].id).ok).toBe(true);
    expect(gameService.getActivePlayerCount()).toBe(10);
  });

  test('serializes the current round number in table snapshots', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;

    for (let i = 2; i <= 11; i++) {
      expect(roomService.joinRoom(createSocket(i), { code, username: `p${i}` }).ok).toBe(true);
    }

    expect(gameService.startGame(hostSocket.id, { code }).ok).toBe(true);
    const game = roomRegistry.findByCode(code);

    const table = serializeTable(game, 'host');
    expect(table.roundNum).toBe(1);
  });

  test('serializes a full eleven-player table snapshot without crashing', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;

    for (let i = 2; i <= 11; i++) {
      expect(
        roomService.joinRoom(createSocket(i), { code, username: `p${i}` }).ok
      ).toBe(true);
    }

    expect(gameService.startGame(hostSocket.id, { code }).ok).toBe(true);
    const game = roomRegistry.findByCode(code);

    const table = serializeTable(game, 'host');
    expect(table.playerCount).toBe(11);
    expect(table.players).toHaveLength(11);
    expect(table.hero).toBeTruthy();
    expect(Array.isArray(table.communityCards)).toBe(true);
  });

  test('reassigns host after host disconnects and still allows next host to start the game', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;

    const secondSocket = createSocket(2);
    expect(roomService.joinRoom(secondSocket, { code, username: 'p2' }).ok).toBe(true);
    for (let i = 3; i <= 11; i++) {
      expect(roomService.joinRoom(createSocket(i), { code, username: `p${i}` }).ok).toBe(true);
    }

    expect(gameService.handleDisconnect(hostSocket.id).ok).toBe(true);
    const game = roomRegistry.findByCode(code);
    expect(game.host).toBe('p2');

    const newHostStart = gameService.startGame(secondSocket.id, { code });
    expect(newHostStart.ok).toBe(true);
  });

  test('emits NOT_PLAYER_TURN over sockets when a waiting player acts out of turn', () => {
    const roomRegistry = createRoomRegistry();
    const socketHandlers = {};
    const io = {
      on(eventName, handler) {
        if (eventName === 'connection') {
          socketHandlers.connection = handler;
        }
      },
    };
    registerSocketHandlers(io, roomRegistry);

    const hostSocket = createSocket(1);
    socketHandlers.connection(hostSocket);
    hostSocket.emit('host', { username: 'host' });
    const roomCode = hostSocket.emitted.find((entry) => entry.eventName === 'room:snapshot').payload.code;

    const sockets = [hostSocket];
    for (let i = 2; i <= 11; i++) {
      const socket = createSocket(i);
      sockets.push(socket);
      socketHandlers.connection(socket);
      socket.emit('join', { code: roomCode, username: `p${i}` });
    }

    hostSocket.emit('startGame', { code: roomCode });

    const room = roomRegistry.findByCode(roomCode);
    const currentTurnPlayer = getCurrentTurnPlayer(room);
    const waitingPlayer = room.players.find((player) => player.getUsername() !== currentTurnPlayer.getUsername());

    waitingPlayer.socket.emit('moveMade', { move: 'call' });

    const latestGameError = waitingPlayer.socket.emitted
      .filter((entry) => entry.eventName === 'game:error')
      .at(-1);

    expect(latestGameError).toBeTruthy();
    expect(latestGameError.payload).toMatchObject({ code: 'NOT_PLAYER_TURN' });
  });

  test('emits INVALID_MOVE over sockets when the active player sends an unknown move', () => {
    const roomRegistry = createRoomRegistry();
    const socketHandlers = {};
    const io = {
      on(eventName, handler) {
        if (eventName === 'connection') {
          socketHandlers.connection = handler;
        }
      },
    };
    registerSocketHandlers(io, roomRegistry);

    const hostSocket = createSocket(1);
    socketHandlers.connection(hostSocket);
    hostSocket.emit('host', { username: 'host' });
    const roomCode = hostSocket.emitted.find((entry) => entry.eventName === 'room:snapshot').payload.code;

    for (let i = 2; i <= 11; i++) {
      const socket = createSocket(i);
      socketHandlers.connection(socket);
      socket.emit('join', { code: roomCode, username: `p${i}` });
    }

    hostSocket.emit('startGame', { code: roomCode });

    const room = roomRegistry.findByCode(roomCode);
    const currentTurnPlayer = getCurrentTurnPlayer(room);

    currentTurnPlayer.socket.emit('moveMade', { move: 'banana' });

    const latestGameError = currentTurnPlayer.socket.emitted
      .filter((entry) => entry.eventName === 'game:error')
      .at(-1);

    expect(latestGameError).toBeTruthy();
    expect(latestGameError.payload).toMatchObject({ code: 'INVALID_MOVE' });
  });

  test('emits refreshed table snapshots to every player after a valid move', () => {
    const roomRegistry = createRoomRegistry();
    const socketHandlers = {};
    const io = {
      on(eventName, handler) {
        if (eventName === 'connection') {
          socketHandlers.connection = handler;
        }
      },
    };
    registerSocketHandlers(io, roomRegistry);

    const hostSocket = createSocket(1);
    socketHandlers.connection(hostSocket);
    hostSocket.emit('host', { username: 'host' });
    const roomCode = hostSocket.emitted.find((entry) => entry.eventName === 'room:snapshot').payload.code;

    const sockets = [hostSocket];
    for (let i = 2; i <= 11; i++) {
      const socket = createSocket(i);
      sockets.push(socket);
      socketHandlers.connection(socket);
      socket.emit('join', { code: roomCode, username: `p${i}` });
    }

    hostSocket.emit('startGame', { code: roomCode });

    const room = roomRegistry.findByCode(roomCode);
    const currentTurnPlayer = getCurrentTurnPlayer(room);
    const snapshotsBefore = sockets.map((socket) =>
      socket.emitted.filter((entry) => entry.eventName === 'table:snapshot').length
    );

    currentTurnPlayer.socket.emit('moveMade', { move: 'call' });

    const snapshotsAfter = sockets.map((socket) =>
      socket.emitted.filter((entry) => entry.eventName === 'table:snapshot').length
    );

    snapshotsAfter.forEach((count, index) => {
      expect(count).toBeGreaterThan(snapshotsBefore[index]);
    });
  });

  test('keeps turn and round number stable when rejecting off-turn and invalid moves over sockets', () => {
    const roomRegistry = createRoomRegistry();
    const socketHandlers = {};
    const io = {
      on(eventName, handler) {
        if (eventName === 'connection') {
          socketHandlers.connection = handler;
        }
      },
    };
    registerSocketHandlers(io, roomRegistry);

    const hostSocket = createSocket(1);
    socketHandlers.connection(hostSocket);
    hostSocket.emit('host', { username: 'host' });
    const roomCode = hostSocket.emitted.find((entry) => entry.eventName === 'room:snapshot').payload.code;

    const sockets = [hostSocket];
    for (let i = 2; i <= 11; i++) {
      const socket = createSocket(i);
      sockets.push(socket);
      socketHandlers.connection(socket);
      socket.emit('join', { code: roomCode, username: `p${i}` });
    }

    hostSocket.emit('startGame', { code: roomCode });

    const room = roomRegistry.findByCode(roomCode);
    const currentTurnPlayer = getCurrentTurnPlayer(room);
    const waitingPlayer = room.players.find((player) => player.getUsername() !== currentTurnPlayer.getUsername());
    const beforeTurn = room.roundData.turn;
    const beforeRoundNum = room.roundNum;

    waitingPlayer.socket.emit('moveMade', { move: 'call' });
    currentTurnPlayer.socket.emit('moveMade', { move: 'banana' });

    const waitingPlayerLatestError = waitingPlayer.socket.emitted
      .filter((entry) => entry.eventName === 'game:error')
      .at(-1);
    const currentTurnLatestError = currentTurnPlayer.socket.emitted
      .filter((entry) => entry.eventName === 'game:error')
      .at(-1);

    expect(waitingPlayerLatestError.payload).toMatchObject({ code: 'NOT_PLAYER_TURN' });
    expect(currentTurnLatestError.payload).toMatchObject({ code: 'INVALID_MOVE' });
    expect(room.roundData.turn).toBe(beforeTurn);
    expect(room.roundNum).toBe(beforeRoundNum);
  });

  test('can advance to the next round through gameService after a full ring hand completes', () => {
    const roomRegistry = createRoomRegistry();
    const roomService = createRoomService(roomRegistry, Game, sanitizeRoomSettings);
    const gameService = createGameService(roomRegistry);

    const hostSocket = createSocket(1);
    const hostResult = roomService.hostRoom(hostSocket, { username: 'host' });
    const code = hostResult.room.code;

    for (let i = 2; i <= 11; i++) {
      expect(roomService.joinRoom(createSocket(i), { code, username: `p${i}` }).ok).toBe(true);
    }

    expect(gameService.startGame(hostSocket.id, { code }).ok).toBe(true);
    const game = roomRegistry.findByCode(code);

    let actions = 0;
    while (game.roundInProgress) {
      const player = getCurrentTurnPlayer(game);
      expect(player).toBeDefined();
      const topBet = game.getCurrentTopBet();
      const playerBet = game.getPlayerBetInStage(player);
      const acted = topBet > playerBet ? game.call(player.socket) : game.check(player.socket);
      expect(acted).toBe(true);
      actions += 1;
      expect(actions).toBeLessThan(10000);
    }

    const result = gameService.startNextRound(hostSocket.id);
    expect(result.ok).toBe(true);
    expect(result.game.roundInProgress).toBe(true);
    expect(result.game.roundNum).toBe(2);
  });
});
