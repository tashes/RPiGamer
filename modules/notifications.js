(function () {
  let uuid;
  if (typeof uuid === "undefined") {
    uuid = require('uuid');
  }

  // Setup notification sound
  let notifsound = new Audio('intuition.mp3');

  // Setup html
  let notifs_style = document.createElement('style');
  notifs_style.innerHTML = `
  @keyframes notification_short {
    0% {
      opacity:0;
      transform:translateX(16px);
    }
    18% {
      opacity:1;
      transform:translateX(0px);
    }
    88% {
      opacity:1;
      transform:translateX(0px);
    }
    100% {
      opacity:0;
      transform:translateX(16px);
    }
  }
  @keyframes notification_medium {
    0% {
      opacity:0;
      transform:translateX(16px);
    }
    12% {
      opacity:1;
      transform:translateX(0px);
    }
    92% {
      opacity:1;
      transform:translateX(0px);
    }
    100% {
      opacity:0;
      transform:translateX(16px);
    }
  }
  @keyframes notification_long {
    0% {
      opacity:0;
      transform:translateX(16px);
    }
    9% {
      opacity:1;
      transform:translateX(0px);
    }
    94% {
      opacity:1;
      transform:translateX(0px);
    }
    100% {
      opacity:0;
      transform:translateX(16px);
    }
  }
  @keyframes notification_perm {
    0% {
      opacity:0;
      transform:translateX(16px);
    }
    100% {
      opacity:1;
      transform:translateX(0px);
    }
  }
  @keyframes notification_perm_exit {
    0% {
      opacity:1;
      transform:translateX(0px);
    }
    100% {
      opacity:0;
      transform:translateX(16px);
    }
  }
  #notifs {
    min-width:32%;
    height:100%;
    padding:32px;
    position:absolute;
    top:0px;
    right:0px;
    box-sizing:border-box;
  }
  #notifs > div {
    padding:16px;
    margin-bottom:16px;
    border-radius:2px;
    background:#e2e1e0;
    opacity:0;
    font-family:Roboto;
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  }
  #notifs > div.short {
    animation: notification_short 2s;
  }
  #notifs > div.medium {
    animation: notification_medium 3s;
  }
  #notifs > div.long {
    animation: notification_long 4s;
  }
  #notifs > .perm {
    opacity:1 !important;
    animation: notification_perm 0.36s;
  }
  #notifs > .perm.exit {
    animation: notification_perm_exit 0.24s;
  }`;
  let notifs_ele = document.createElement('div');
  notifs_ele.id = "notifs";
  document.querySelector('head').appendChild(notifs_style);
  document.querySelector('body').appendChild(notifs_ele);

  // display notification function
  function notify (length, message) {
    let p = document.createElement('div');
    p.innerHTML = message;
    p.className = length;
    notifs_ele.appendChild(p);
    switch (length) {
      case "short":
        setTimeout(() => {
          notifs_ele.removeChild(p);
        }, 2000);
        break;
      case "medium":
        setTimeout(() => {
          notifs_ele.removeChild(p);
        }, 3000);
        break;
      case "long":
        setTimeout(() => {
          notifs_ele.removeChild(p);
        }, 4000);
        break;
      case "perm":
        let id = uuid.v4();
        p.setAttribute('data-id', id);
        return id;
        break;
    }
    notifsound.play();
  };
  // clear perm notifications function
  function clearPermNotificationById (id) {
    let ele = document.querySelector(`[data-id="${id}"]`);
    ele.className += " exit";
    setTimeout(function () {
      if (ele !== null) {
        ele.parentElement.removeChild(ele);
      }
    }, 240);
  };
  function playNotifSound () {
    notifsound.play();
  };

  window.notify = notify;
  window.clearPermNotificationById = clearPermNotificationById;
  window.playNotifSound = playNotifSound;
})();

(function () {
  let electron, ipcRenderer, ip;
  if (typeof electron === "undefined") {
    electron = require('electron')
  }
  if (typeof ipcRenderer === "undefined") {
    ipcRenderer = electron.ipcRenderer;
  }
  if (typeof ip === "undefined") {
    ip = require('ip');
  }

  let IP_NOTIFICATION = "";

  // Set up listeners
  ipcRenderer.on('controller::start', function () {
    IP_NOTIFICATION = notify("perm", `Started the controller server on <a href="http://${ip.address()}:9753">http://${ip.address()}:9753</a>.`);
  });
  ipcRenderer.on('controller::occupied', function () {
    clearPermNotificationById(IP_NOTIFICATION);
  });
  ipcRenderer.on('controller::empty', function () {
    IP_NOTIFICATION = notify("perm", `Started the controller server on <a href="http://${ip.address()}:9753">http://${ip.address()}:9753</a>.`);
  });
  ipcRenderer.on('controller::newplayer', function (e, id) {
    notify("medium", `A new player (${id}) has joined this session.`);
  });
  ipcRenderer.on('controller::playerexit', function (e, id) {
    notify("medium", `Player (${id}) has left the session.`);
  });

})();
