(function () {
  let socket;
  if (!socket) {
    socket = io();
  }

  socket.on('player::getdata', function (gamename) {
    let gamedata = window.localStorage.getItem(gamename),
    name = window.localStorage.getItem('$__name');
    gamedata = gamedata ? gamedata : (window.schema ? window.schema : {});
    if (!name) {
      name = "New Player " + Math.round(Math.random() * 10000000);
      window.localStorage.setItem('$__name', name);
    }
    socket.emit('player::getdata', gamedata, name);
  });
  socket.on('player::savedata', function (gamename, data) {
    window.localStorage.setItem(gamename, data);
    socket.emit('player::savedata', true);
  });
})();
