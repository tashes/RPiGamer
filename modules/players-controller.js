let socket;
(function () {
  if (!socket) {
    socket = io();
  }

  let NAME;

  // Standard UI
  (function () {
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
      #__controller
      {
        display:flex;
        justify-contents:center;
        align-items:center;
        flex-direction:row-reverse;
        position:absolute;
        top:16px;
        right:16px;
      }
      #__controller_quit,
      #__controller_settings
      {
        width:auto;
        height:auto;
        padding:16px;
        margin-left:16px;
        background:#e2e1e0;
        box-shadow:0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      }
    `;
    document.querySelector('head').appendChild(styles);
    let controller = document.createElement('div');
    controller.id = "__controller";
    let controller_quit = document.createElement('div');
    controller_quit.id = "__controller_quit";
    controller_quit.innerHTML = "QUIT";
    controller_quit.addEventListener('click', function () {
      socket.emit('command::quit');
    });
    controller.appendChild(controller_quit);
    let controller_settings = document.createElement('div');
    controller_settings.id = "__controller_settings";
    controller_settings.innerHTML = "SETTINGS";
    controller_settings.addEventListener('click', function () {
      let prevname = window.localStorage.getItem('$__name');
      let name = prompt("What's your name?", prevname);
      if (name !== null && /\w+/.test(name)) {
        window.localStorage.setItem('$__name', name);
        socket.emit('player::updatename', name, prevname);
      }
    });
    controller.appendChild(controller_settings);

    document.querySelector('body').appendChild(controller);
  })();

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
    let div = document.createElement('div');
    div.id = "__closure";
    div.innerHTML = `${message}`;
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
