(function () {
  let electron, ipcRenderer;
  if (typeof electron === "undefined") {
    electron = require('electron')
  }
  if (typeof ipcRenderer === "undefined") {
    ipcRenderer = electron.ipcRenderer;
  }

  function emit (evt,  ...ms) {
    if (EVTS[evt] instanceof Array) {
      EVTS[evt].forEach(p => {
        p(...ms);
      });
    }
  };

  class Player {
    constructor (id) {
      this.id = id;
      if (typeof PLAYERS[id] === "undefined") {
        PLAYERS[id] = {
          id: id,
          name: "awaiting",
          playerdata: "awaiting",
          currentdata: {},
          evts: {}
        };
        ipcRenderer.send('player::getdata', id);
      }
    }

    get name () {
      return PLAYERS[this.id].name;
    }

    get saveData () {
      return PLAYERS[this.id].playerdata;
    }

    get currentData () {
      return PLAYERS[this.id].currentdata;
    }

    set currentData (currentdata) {
      PLAYERS[this.id].currentdata = currentdata;
    }

    onAction (evtname, callback) {
      if (!(PLAYERS[this.id].evts[evtname] instanceof Array)) {
        PLAYERS[this.id].evts[evtname] = [];
      }
      PLAYERS[this.id].evts[evtname].push(callback);
    }

    save () {
      ipcRenderer.send('player::savedata', this.id, JSON.stringify(PLAYERS[this.id].currentdata));
    }
  }

  let Players = {};
  let EVTS = {};
  let PLAYERS = {};

  Players.on = function (evt, callback) {
    if (!(EVTS[evt] instanceof Array)) {
      EVTS[evt] = [];
    }
    EVTS[evt].push(callback);
  };
  Players.getPlayers = function () {
    return Object.keys(PLAYERS).map(p => new Player(p));
  };
  Players.getAllCurrentData = function () {
    return Object.keys(PLAYERS).map(p => new Player(p).currentData);
  };

  // Scilence level >=1 notifications
  if (window.notify) window.setNotificationLevel(0);

  // Setup Listeners
  ipcRenderer.on('controller::newplayer', function (e, id) {
    // Makes a player & starts by getting all the player data
    let player = new Player(id);
    emit('player::newplayer', player);
  });
  ipcRenderer.on('controller::playerexit', function (e, id) {
    // Removes player
    emit('player::playerexit', new Player(id));
    delete PLAYERS[id];
  });
  ipcRenderer.on('action::player::getdata', function (e, id, data, name) {
    PLAYERS[id].playerdata = PLAYERS[id].currentdata = data;
    PLAYERS[id].name = name;
    emit('player::getdata', new Player(id));
    if (window.notify) {
      window.notify("medium", `New Player <i>${PLAYERS[id].name} has joined the game.`);
    }
  });
  ipcRenderer.on('action::player::savedata', function (e, id, success) {
    emit('player::savedata', new Player(id));
    if (window.notify) {
      window.setNotificationLevel(0);
      window.notify("short", success ? `Player ${PLAYERS[id].name} has saved his game.` : `Player ${PLAYERS[id].name} could not save the game.`);
    }
  });
  ipcRenderer.on('action::player::updatename', function (e, id, name, prevname) {
    PLAYERS[id].name = name;
    emit('player::updatename', new Player(id));
    if (window.notify) {
      window.notify("medium", `Player ${prevname} has changed name to ${name}`);
    }
  });
  ipcRenderer.on('action::player::action', function (e, id, evtname, data) {
    PLAYERS[id].evts[evtname].forEach(p => p(...data));
  });
  ipcRenderer.on('action::command::quit', function () {
    ipcRenderer.send('command::stop');
  });

  window.Players = Players;
})();
