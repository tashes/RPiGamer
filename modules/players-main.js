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
        console.log(ms);
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
          currentdata: {}
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

    save () {
      ipcRenderer.send('player::savedata', id, PLAYERS[this.id].currentdata);
    }
  }

  let Players = {};
  let EVTS = {};
  let PLAYERS = {};

  Players.on = function (evt, callback) {
    if (!(EVTS[evt] instanceof Array)) {
      EVTS[evt] = [];
    }
    evts[evt].push(callback);
  };
  Players.getPlayers = function () {
    return Object.keys(PLAYERS).map(p => new Player(p.id));
  };

  // Scilence level >=1 notifications
  if (window.notify) window.setNotificationLevel(0);

  // Setup Listeners
  ipcRenderer.on('controller::newplayer', function (e, id) {
    // Makes a player & starts by getting all the player data
    let player = new Player(id);
    emit('player::newplayer', player);
    if (window.notify) {
      window.notify("medium", `New Player <i>${player.name}`);
    }
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
  });
  ipcRenderer.on('action::player::savedata', function (e, id, success) {
    emit('player::savedata', new Player(id));
    if (window.notify) {
      window.setNotificationLevel(0);
      window.notify("short", success ? `Player ${PLAYERS[id].name} has saved his game.` : `Player ${PLAYERS[id].name} could not save the game.`);
    }
  });

  window.Players = Players;
})();
