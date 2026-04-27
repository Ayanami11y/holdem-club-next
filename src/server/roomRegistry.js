function createRoomRegistry() {
  let rooms = [];

  const list = () => rooms;

  const setRooms = (nextRooms) => {
    rooms = nextRooms;
    return rooms;
  };

  const add = (game) => {
    rooms.push(game);
    return game;
  };

  const remove = (game) => {
    rooms = rooms.filter((room) => room !== game);
    return rooms;
  };

  const count = () => rooms.length;

  const findByCode = (code) => rooms.find((room) => room.getCode() === code);

  const findBySocketId = (socketId) =>
    rooms.find((room) => {
      const player = room.findPlayer(socketId);
      return player && player.socket && player.socket.id === socketId;
    });

  const replace = (game) => {
    rooms = rooms.map((room) => (room.getCode() === game.getCode() ? game : room));
    return game;
  };

  return {
    list,
    setRooms,
    add,
    remove,
    count,
    findByCode,
    findBySocketId,
    replace,
  };
}

module.exports = { createRoomRegistry };
