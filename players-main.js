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
      EVTS[evt].forEach(p => p(ms...));
    }
  };

  class Player {
    constructor (id) {
      this.id = id;
      if (typeof PLAYERS[id] === "undefined") {
        PLAYERS[id] = {
          id: id,
          playerdata: "awaiting",
          currentdata: {}
        };
        ipcRenderer.send('player::getdata', id);
      }
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

  // Setup Listeners
  ipcRenderer.on('controller::newplayer', function (e, id) {
    // Makes a player & starts by getting all the player data

  });
  ipcRenderer.on('controller::playerexit', function (e, id) {
    // Removes player
  });

  window.Players = Players;
})();
