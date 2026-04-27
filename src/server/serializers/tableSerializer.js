function serializePlayerSeat(game, player, index) {
  return {
    seatIndex: index,
    username: player.getUsername(),
    status: player.getStatus(),
    blind: player.getBlind(),
    stack: player.getMoney(),
    buyIns: player.getBuyIns(),
    dealer: player.getDealer(),
    allIn: Boolean(player.allIn),
    folded: player.getStatus() === 'Fold',
    isChecked: game.playerIsChecked(player),
    currentBet: game.getPlayerBetInStage(player),
  };
}

function serializeTable(game, heroUsername) {
  const players = game.players.map((player, index) =>
    serializePlayerSeat(game, player, index)
  );

  const heroPlayer = heroUsername
    ? game.players.find((player) => player.getUsername() === heroUsername)
    : undefined;

  return {
    code: game.getCode(),
    stage: game.roundInProgress ? game.getStageName() : '等待开局',
    roundNum: Number.isInteger(game.roundNum) ? game.roundNum : 0,
    pot: game.getCurrentPot(),
    topBet: game.getCurrentTopBet(),
    communityCards: Array.isArray(game.community) ? game.community : [],
    currentTurn: game.roundData.turn || '',
    roundInProgress: Boolean(game.roundInProgress),
    players,
    playerCount: players.length,
    hero: heroPlayer
      ? {
          username: heroPlayer.getUsername(),
          stack: heroPlayer.getMoney(),
          cards: Array.isArray(heroPlayer.cards) ? heroPlayer.cards : [],
          status: heroPlayer.getStatus(),
          blind: heroPlayer.getBlind(),
          currentBet: game.getPlayerBetInStage(heroPlayer),
          buyIns: heroPlayer.getBuyIns(),
        }
      : null,
  };
}

module.exports = {
  serializeTable,
};
