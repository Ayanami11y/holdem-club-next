const io = require('socket.io-client');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(predicate, timeoutMs, label, debugClients = []) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      while (Date.now() - started < timeoutMs) {
        const value = predicate();
        if (value) {
          resolve(value);
          return;
        }
        await sleep(50);
      }
      reject(new Error(`Timeout waiting for ${label}: ${JSON.stringify(debugClients.map((client) => ({ name: client.name, connected: client.socket.connected, errors: client.errors.slice(-3), recentEvents: client.events.slice(-8) })), null, 2)}`));
    };
    tick().catch(reject);
  });
}

function normalizeMoves(moves) {
  if (!moves || typeof moves !== 'object') return {};
  return Object.fromEntries(Object.entries(moves).filter(([, value]) => value !== 'no'));
}

function createClient(name, baseUrl = 'http://127.0.0.1:3001') {
  const socket = io(baseUrl, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });

  const state = {
    name,
    socket,
    roomSnapshot: null,
    tableSnapshot: null,
    moves: null,
    errors: [],
    events: [],
  };

  const log = (event, payload) => {
    state.events.push({ event, payload, at: Date.now() });
  };

  socket.on('connect', () => log('connect', { id: socket.id }));
  socket.on('room:snapshot', (payload) => {
    state.roomSnapshot = payload;
    log('room:snapshot', payload && { code: payload.code, players: payload.players, host: payload.host, playerCount: payload.playerCount });
  });
  socket.on('table:snapshot', (payload) => {
    state.tableSnapshot = payload;
    log('table:snapshot', payload && {
      code: payload.code,
      hero: payload.hero && payload.hero.username,
      stage: payload.stage,
      currentTurn: payload.currentTurn,
      roundInProgress: payload.roundInProgress,
      playerCount: payload.playerCount,
      pot: payload.pot,
      roundNum: payload.roundNum,
    });
  });
  socket.on('displayPossibleMoves', (payload) => {
    state.moves = payload;
    log('displayPossibleMoves', payload);
  });
  socket.on('room:error', (payload) => {
    state.errors.push({ type: 'room', payload });
    log('room:error', payload);
  });
  socket.on('game:error', (payload) => {
    state.errors.push({ type: 'game', payload });
    log('game:error', payload);
  });
  socket.on('disconnect', (reason) => {
    log('disconnect', { reason });
  });
  socket.on('connect_error', (error) => {
    log('connect_error', { message: error && error.message });
  });
  socket.on('gameBegin', (payload) => log('gameBegin', payload));
  socket.on('hostRoom', (payload) => log('hostRoom', payload && { code: payload.code, players: payload.players, host: payload.host }));
  socket.on('joinRoom', (payload) => log('joinRoom', payload && { code: payload.code, players: payload.players, host: payload.host }));

  return state;
}

async function connectClient(client) {
  await waitFor(() => client.socket.connected, 5000, `${client.name} connect`);
}

function conservativeActionFromMoves(legalMoves) {
  if (legalMoves.check !== undefined && legalMoves.check !== 'no') return { move: 'check' };
  if (legalMoves.call !== undefined && legalMoves.call !== 'no') return { move: 'call' };
  if (legalMoves.raise !== undefined && legalMoves.raise !== 'no') {
    const minRaise = typeof legalMoves.call === 'number' ? legalMoves.call + 2 : 4;
    return { move: 'raise', bet: minRaise };
  }
  if (legalMoves.bet !== undefined && legalMoves.bet !== 'no') {
    return { move: 'bet', bet: 2 };
  }
  if (legalMoves.fold !== undefined && legalMoves.fold !== 'no') return { move: 'fold' };
  return null;
}

async function driveHand(clients, stepLimit, handIndex, options = {}) {
  const steps = [];
  const seenTurns = new Set();
  const stopBeforeActor = options.stopBeforeActor || null;
  const stopBeforeMove = options.stopBeforeMove || null;

  for (let step = 0; step < stepLimit; step++) {
    const table = clients[0].tableSnapshot;
    if (!table) throw new Error(`Missing table snapshot at hand ${handIndex} step ${step}`);
    if (!table.roundInProgress) {
      return {
        completed: true,
        steps,
        endedBy: 'roundInProgress false',
        roundNumAtEnd: table.roundNum,
        finalStage: table.stage,
      };
    }

    const turnName = table.currentTurn || (await waitFor(() => clients[0].tableSnapshot && clients[0].tableSnapshot.currentTurn, 5000, `turn hand ${handIndex} step ${step}`));
    seenTurns.add(turnName);
    const actor = clients.find((client) => client.name === turnName);
    if (!actor) throw new Error(`No actor found for turn ${turnName}`);

    const actorTable = actor.tableSnapshot;
    if (!actorTable || actorTable.currentTurn !== actor.name || !actorTable.roundInProgress) {
      await sleep(120);
      continue;
    }

    actor.moves = null;
    actor.socket.emit('evaluatePossibleMoves');
    const rawMoves = await waitFor(() => actor.moves, 5000, `${actor.name} possible moves`);
    const legalMoves = normalizeMoves(rawMoves);
    const action = conservativeActionFromMoves(legalMoves);
    if (!action) {
      throw new Error(`No legal conservative move for ${actor.name}: ${JSON.stringify(rawMoves)}`);
    }

      if (stopBeforeActor && actor.name === stopBeforeActor && (!stopBeforeMove || stopBeforeMove(action, actor, table, legalMoves))) {
        return {
          completed: false,
          interrupted: true,
          stopReason: 'before-actor-move',
          pendingActor: actor.name,
          pendingAction: action,
          legalMoves,
          steps,
          tableSnapshot: table,
          roundNumAtStop: table.roundNum,
        };
      }

      const hostTableBefore = clients[0].tableSnapshot;
    const actorTableBefore = actor.tableSnapshot;
    const beforeTurn = hostTableBefore && hostTableBefore.currentTurn;
    const beforeRoundNum = hostTableBefore && hostTableBefore.roundNum;
    const beforeActorStack = actorTableBefore && actorTableBefore.hero && actorTableBefore.hero.stack;
    const beforeActorBet = actorTableBefore && actorTableBefore.hero && actorTableBefore.hero.currentBet;
    const eventCountsBefore = new Map(clients.map((client) => [client.name, client.events.length]));
    const actorErrorsBefore = actor.errors.length;
    actor.socket.emit('moveMade', action);
    steps.push({ handIndex, step, actor: actor.name, legalMoves, action: action.move });

    await waitFor(() => {
      const latest = clients[0].tableSnapshot;
      const actorLatest = actor.tableSnapshot;
      if (!latest) return false;
      if (!latest.roundInProgress) return true;
      if (latest.currentTurn !== beforeTurn || latest.roundNum !== beforeRoundNum) return true;
      if (actorLatest && actorLatest.hero) {
        if (actorLatest.hero.stack !== beforeActorStack || actorLatest.hero.currentBet !== beforeActorBet) {
          return true;
        }
      }
      if (actor.errors.length > actorErrorsBefore) {
        const latestError = actor.errors[actor.errors.length - 1];
        throw new Error(JSON.stringify({
          reason: 'move emitted but no table advance',
          actor: actor.name,
          action,
          rawMoves,
          latestError,
          actorErrors: actor.errors,
          actorRecentEvents: actor.events.slice(-12),
          hostRecentEvents: clients[0].events.slice(-12),
          hostTable: latest,
          actorTable: actorLatest,
        }, null, 2));
      }
      return clients.some((client) => client.events.length > (eventCountsBefore.get(client.name) || 0));
    }, 4000, `table advance after ${actor.name} ${action.move}`, clients);
  }

  return {
    completed: false,
    steps,
    endedBy: 'step limit',
    lastTable: clients[0].tableSnapshot,
    lastMovesByActor: Object.fromEntries(clients.map((client) => [client.name, client.moves])),
    seenTurns: Array.from(seenTurns),
    recentEvents: clients.map((client) => ({ name: client.name, recentEvents: client.events.slice(-6), errors: client.errors })),
  };
}

function summarizeClient(client) {
  return {
    name: client.name,
    connected: client.socket.connected,
    errors: client.errors,
    room: client.roomSnapshot && {
      code: client.roomSnapshot.code,
      host: client.roomSnapshot.host,
      playerCount: client.roomSnapshot.playerCount,
    },
    table: client.tableSnapshot && {
      code: client.tableSnapshot.code,
      hero: client.tableSnapshot.hero && client.tableSnapshot.hero.username,
      stage: client.tableSnapshot.stage,
      currentTurn: client.tableSnapshot.currentTurn,
      roundInProgress: client.tableSnapshot.roundInProgress,
      playerCount: client.tableSnapshot.playerCount,
      pot: client.tableSnapshot.pot,
      roundNum: client.tableSnapshot.roundNum,
    },
    recentEvents: client.events.slice(-10),
  };
}

async function main() {
  const { bootstrap } = require('./src/app');
  const runtime = bootstrap({ port: 3011 });
  await new Promise((resolve) => runtime.server.listen(runtime.port, resolve));
  const clientNames = Array.from({ length: 11 }, (_, index) => (index === 0 ? 'host' : `p${index + 1}`));
  const clients = clientNames.map((name) => createClient(name, 'http://127.0.0.1:3011'));

  try {
    for (const client of clients) {
      await connectClient(client);
    }

    clients[0].socket.emit('host', {
      username: 'host',
      settings: {
        smallBlind: 1,
        bigBlind: 2,
        startingStack: 120,
        autoRebuy: false,
        autoRebuyStack: 120,
      },
    });

    const roomCode = await waitFor(() => clients[0].roomSnapshot && clients[0].roomSnapshot.code, 5000, 'host room code');

    for (let i = 1; i < clients.length; i++) {
      clients[i].socket.emit('join', { username: clients[i].name, code: roomCode });
    }

    await waitFor(
      () => clients.every((client) => client.roomSnapshot && client.roomSnapshot.players && client.roomSnapshot.players.length === 11),
      8000,
      'all clients see 11 players'
    );

    clients[0].socket.emit('startGame', { code: roomCode });

    await waitFor(
      () => clients.every((client) => client.tableSnapshot && client.tableSnapshot.playerCount === 11 && client.tableSnapshot.hero),
      8000,
      'all table snapshots after start'
    );

    const initialRoundNum = await waitFor(
      () => clients[0].tableSnapshot && Number.isInteger(clients[0].tableSnapshot.roundNum) && clients[0].tableSnapshot.roundNum > 0
        ? clients[0].tableSnapshot.roundNum
        : false,
      3000,
      'initial round number',
      clients
    );

    const hands = [];
    const roundNumsAtStart = [];
    for (let handIndex = 1; handIndex <= 11; handIndex++) {
      const currentRoundNum = await waitFor(
        () => clients[0].tableSnapshot && Number.isInteger(clients[0].tableSnapshot.roundNum) && clients[0].tableSnapshot.roundNum >= initialRoundNum
          ? clients[0].tableSnapshot.roundNum
          : false,
        3000,
        `round number before hand ${handIndex}`,
        clients
      );
      roundNumsAtStart.push(currentRoundNum);
      const hand = await driveHand(clients, 260, handIndex);
      hands.push(hand);
      if (!hand.completed) {
        throw new Error(JSON.stringify({ handIndex, hand }, null, 2));
      }
      if (handIndex < 11) {
        const previousRoundNum = clients[0].tableSnapshot && clients[0].tableSnapshot.roundNum;
        clients[0].socket.emit('startNextRound');
        await waitFor(
          () => {
            const snapshot = clients[0].tableSnapshot;
            return snapshot && snapshot.roundInProgress && snapshot.roundNum > previousRoundNum ? snapshot : false;
          },
          4000,
          `round ${handIndex + 1} start after restart`,
          clients
        );
      }
    }

    const boundaryRoundBase = clients[0].tableSnapshot && clients[0].tableSnapshot.roundNum;
    clients[0].socket.emit('startNextRound');
    await waitFor(
      () => {
        const snapshot = clients[0].tableSnapshot;
        return snapshot && snapshot.roundInProgress && snapshot.roundNum > boundaryRoundBase ? snapshot : false;
      },
      4000,
      'boundary probe round start',
      clients
    );

    const boundaryProbe = await driveHand(clients, 260, 'boundary-probe', {
      stopBeforeActor: 'p2',
    });
    if (!boundaryProbe.interrupted || boundaryProbe.pendingActor !== 'p2') {
      throw new Error(JSON.stringify({ reason: 'failed to stop before boundary probe actor turn', boundaryProbe }, null, 2));
    }

    const currentTurnName = boundaryProbe.pendingActor;
    const offTurnClient = clients.find((client) => client.name !== currentTurnName) || clients[1];
    const errorsBefore = offTurnClient.errors.length;
    offTurnClient.socket.emit('moveMade', { move: 'call' });
    await waitFor(
      () => offTurnClient.errors.length > errorsBefore,
      3000,
      'off-turn move rejection',
      clients
    );

    const invalidMoveClient = clients.find((client) => client.name === currentTurnName) || clients[0];
    const invalidErrorsBefore = invalidMoveClient.errors.length;
    invalidMoveClient.socket.emit('moveMade', { move: 'banana' });
    await waitFor(
      () => invalidMoveClient.errors.length > invalidErrorsBefore,
      3000,
      'invalid move rejection',
      clients
    );

    const finishProbeHand = await driveHand(clients, 260, 'boundary-finish', {
      stopBeforeActor: 'p2',
    });
    if (!(finishProbeHand.completed || finishProbeHand.interrupted)) {
      throw new Error(JSON.stringify({ reason: 'boundary probe hand did not remain recoverable after rejection checks', finishProbeHand }, null, 2));
    }

    clients[2].socket.disconnect();
    await sleep(250);

    return {
      ok: true,
      roomCode,
      handCount: hands.length,
      roundNumsAtStart,
      stepsPerHand: hands.map((hand) => hand.steps.length),
      totalSteps: hands.reduce((sum, hand) => sum + hand.steps.length, 0),
      boundaryChecks: {
        offTurnMoveRejected: offTurnClient.errors.some((entry) => entry.type === 'game' && entry.payload && entry.payload.code === 'NOT_PLAYER_TURN'),
        invalidMoveRejected: invalidMoveClient.errors.some((entry) => entry.type === 'game' && entry.payload && entry.payload.code === 'INVALID_MOVE'),
        disconnectObserved: !clients[2].socket.connected,
      },
      finalRoundNum: clients[0].tableSnapshot && clients[0].tableSnapshot.roundNum,
      clients: clients.map(summarizeClient),
    };
  } finally {
    for (const client of clients) {
      try {
        client.socket.disconnect();
      } catch (error) {
      }
    }
    await new Promise((resolve) => runtime.server.close(resolve));
  }
}

main()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
    process.exit(1);
  });
