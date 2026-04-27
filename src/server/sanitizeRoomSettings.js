function sanitizeRoomSettings(settings) {
  const incoming = settings || {};
  const smallBlindRaw = Number(incoming.smallBlind);
  const bigBlindRaw = Number(incoming.bigBlind);
  const startingStackRaw = Number(incoming.startingStack);
  const autoRebuyStackRaw = Number(incoming.autoRebuyStack);

  const smallBlind = Number.isFinite(smallBlindRaw)
    ? Math.max(1, Math.min(1000, Math.floor(smallBlindRaw)))
    : 1;
  const bigBlind = Number.isFinite(bigBlindRaw)
    ? Math.max(smallBlind + 1, Math.min(2000, Math.floor(bigBlindRaw)))
    : Math.max(2, smallBlind * 2);
  const minStack = bigBlind * 10;
  const startingStack = Number.isFinite(startingStackRaw)
    ? Math.max(minStack, Math.min(50000, Math.floor(startingStackRaw)))
    : 100;
  const autoRebuy = typeof incoming.autoRebuy === 'boolean' ? incoming.autoRebuy : true;
  const autoRebuyStack = Number.isFinite(autoRebuyStackRaw)
    ? Math.max(minStack, Math.min(50000, Math.floor(autoRebuyStackRaw)))
    : startingStack;

  return {
    blinds: { small: smallBlind, big: bigBlind },
    buyIn: {
      startingStack,
      autoRebuy,
      autoRebuyStack: autoRebuy ? autoRebuyStack : startingStack,
    },
  };
}

module.exports = { sanitizeRoomSettings };
