let socket;
(function () {
  if (!socket) {
    socket = io();
  }

  let NAME;

  socket.on('player::getdata', function (gamename) {
    let gamedata = window.localStorage.getItem(gamename);
    gamedata = gamedata ? gamedata : (window.SCHEMA ? window.SCHEMA : {});
    NAME = window.localStorage.getItem('$__name');
    if (!NAME) {
      NAME = "New Player " + Math.round(Math.random() * 10000000);
      window.localStorage.setItem('$__name', NAME);
    }
    try {
      let p = JSON.parse(gamedata);
      socket.emit('player::getdata', p, NAME);
    }
    catch (e) {
      socket.emit('player::getdata', window.SCHEMA ? window.SCHEMA : {}, NAME);
    }
  });
  socket.on('player::savedata', function (gamename, data) {
    window.localStorage.setItem(gamename, data);
    socket.emit('player::savedata', true);
  });
  socket.on('player::close', function (message) {
    let styles = document.createElement('style');
    styles.innerHTML = `
      #__closure
      {
        width:100%;
        height:100%;
        position:sticky;
        top:0px;
        left:0px;
        background:rgba(0,0,0,0.84);
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
      }
    `;
    let div = document.createElement('div');
    div.id = "__closure";
    div.innerHTML = `${message}`;
    document.querySelector('head').appendChild(styles);
    document.querySelector('body').appendChild(div);
  });
  socket.on('command::reload', function () {
    location.reload();
  });
  socket.on('disconnect', function () {
    socket.disconnect(true);
  });


  window.action = function (name, ...data) {
    socket.emit('player::action', name, data);
  };
  window.addEventListener('blur', function () {
    socket.disconnect(true);
  });
})();
