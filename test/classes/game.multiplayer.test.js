const Game = require('../../src/classes/game.js');
const events = require('events');

function createSocket(id) {
  const socket = new events.EventEmitter();
  socket.id = id;
  return socket;
}

function createElevenPlayerGame(startingStack = 1000) {
  const game = new Game('stress-table', 'p1');
  game.smallBlind = 5;
  game.bigBlind = 10;
  game.autoBuyIns = false;

  for (let i = 1; i <= 11; i++) {
    const socket = createSocket(i);
    const player = game.addPlayer(`p${i}`, socket);
    player.money = startingStack;
    player.allIn = false;
  }

  return game;
}

function getCurrentTurnPlayer(game) {
  return game.players.find((player) => player.getUsername() === game.roundData.turn);
}

function progressSingleAction(game) {
  const player = getCurrentTurnPlayer(game);
  expect(player).toBeDefined();

  const topBet = game.getCurrentTopBet();
  const playerBet = game.getPlayerBetInStage(player);

  if (player.money <= 0 || player.allIn || player.getStatus() === 'Fold') {
    return false;
  }

  if (topBet > playerBet) {
    return game.call(player.socket);
  }

  return game.check(player.socket);
}

describe('11-player endurance simulation', () => {
  test('supports eleven players across more than ten completed rounds without deadlock', () => {
    const game = createElevenPlayerGame();
    game.startGame();

    let completedRounds = 0;
    let safety = 0;

    while (completedRounds < 11) {
      while (game.roundInProgress) {
        const acted = progressSingleAction(game);
        expect(acted).toBe(true);
        safety += 1;
        expect(safety).toBeLessThan(10000);
      }

      completedRounds += 1;
      if (completedRounds < 11) {
        game.startNextRound();
      }
    }

    expect(completedRounds).toBe(11);
    expect(game.roundNum).toBe(11);
  });

  test('preserves total chips across 11-player simulation when auto rebuy is disabled', () => {
    const game = createElevenPlayerGame(1200);
    const initialTotal = game.players.reduce((sum, player) => sum + player.money, 0);

    game.startGame();
    for (let round = 0; round < 10; round++) {
      let safety = 0;
      while (game.roundInProgress) {
        expect(progressSingleAction(game)).toBe(true);
        safety += 1;
        expect(safety).toBeLessThan(10000);
      }

      if (round < 9) {
        game.startNextRound();
      }
    }

    const finalTotal = game.players.reduce((sum, player) => sum + player.money, 0);
    expect(finalTotal).toBe(initialTotal);
    expect(game.players.every((player) => player.money >= 0)).toBe(true);
  });

  test('keeps dealer and blind rotation progressing across many rounds', () => {
    const game = createElevenPlayerGame();
    const seenDealers = [];
    const seenSmallBlinds = [];
    const seenBigBlinds = [];

    game.startGame();

    for (let round = 0; round < 10; round++) {
      seenDealers.push(game.roundData.dealer);
      seenSmallBlinds.push(game.roundData.smallBlind);
      seenBigBlinds.push(game.roundData.bigBlind);

      let safety = 0;
      while (game.roundInProgress) {
        expect(progressSingleAction(game)).toBe(true);
        safety += 1;
        expect(safety).toBeLessThan(10000);
      }

      if (round < 9) {
        game.startNextRound();
      }
    }

    expect(new Set(seenDealers).size).toBeGreaterThanOrEqual(10);
    expect(new Set(seenSmallBlinds).size).toBeGreaterThanOrEqual(10);
    expect(new Set(seenBigBlinds).size).toBeGreaterThanOrEqual(10);
  });

  test('survives mixed folds and short-stack all-ins in a large table simulation', () => {
    const game = createElevenPlayerGame(300);
    game.players[2].money = 8;
    game.players[5].money = 15;
    game.players[8].money = 25;
    game.startGame();

    let actions = 0;
    while (game.roundInProgress) {
      const player = getCurrentTurnPlayer(game);
      expect(player).toBeDefined();

      const topBet = game.getCurrentTopBet();
      const playerBet = game.getPlayerBetInStage(player);
      let acted;

      if (actions % 4 === 0 && topBet === playerBet && player.money > 0) {
        acted = game.fold(player.socket);
      } else if (topBet > playerBet) {
        acted = game.call(player.socket);
      } else {
        acted = game.check(player.socket);
      }

      expect(acted).toBe(true);
      actions += 1;
      expect(actions).toBeLessThan(5000);
    }

    expect(game.roundInProgress).toBe(false);
    expect(game.players.every((player) => player.money >= 0)).toBe(true);
  });

  test('survives ten rounds with mixed raises, folds, and short-stack all-ins at eleven players', () => {
    const game = createElevenPlayerGame(400);
    game.players[1].money = 14;
    game.players[4].money = 22;
    game.players[7].money = 35;
    game.startGame();

    let roundsCompleted = 0;
    let actions = 0;

    while (roundsCompleted < 10) {
      while (game.roundInProgress) {
        const player = getCurrentTurnPlayer(game);
        expect(player).toBeDefined();

        const topBet = game.getCurrentTopBet();
        const playerBet = game.getPlayerBetInStage(player);
        let acted = false;

        if (player.money > topBet - playerBet && topBet === playerBet && actions % 9 === 0) {
          const raiseTo = Math.min(playerBet + Math.max(game.bigBlind, 20), player.money + playerBet);
          acted = game.bet(player.socket, raiseTo);
          if (acted !== true) {
            acted = game.check(player.socket);
          }
        } else if (topBet === playerBet && actions % 5 === 0 && player.money > 0) {
          acted = game.fold(player.socket);
        } else if (topBet > playerBet) {
          acted = game.call(player.socket);
        } else {
          acted = game.check(player.socket);
        }

        expect(acted).toBe(true);
        actions += 1;
        expect(actions).toBeLessThan(15000);
        expect(game.players.every((candidate) => candidate.money >= 0)).toBe(true);
      }

      roundsCompleted += 1;
      if (roundsCompleted < 10) {
        game.startNextRound();
      }
    }

    expect(roundsCompleted).toBe(10);
    expect(game.players.filter((player) => player.money > 0).length).toBeGreaterThan(1);
  });

  test('promotes a new host when the current host disconnects from a full table', () => {
    const game = createElevenPlayerGame(500);
    expect(game.host).toBe('p1');

    const originalHost = game.players[0];
    game.disconnectPlayer(originalHost);

    expect(game.host).toBe('p2');
    expect(game.players).toHaveLength(10);
    expect(game.players.some((player) => player.getUsername() === 'p1')).toBe(false);
  });
});
