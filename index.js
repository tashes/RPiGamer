const electron = require('electron'),
  url = require('url'),
  path = require('path'),
  http = require('http'),
  socketio = require('socket.io'),
  fs = require('fs'),
  mime = require('mime');

const {app, BrowserWindow, ipcMain} = electron;

let Main = {};
let Controller = {};
let Session = null;
let SessionWindow = null;
let SocketList = [];
let ipaddress = "";

function doToMain (callback) {
  if (Main.isVisible()) {
    callback();
  }
  else {
    Main.once('show', function () {
      callback();
    });
  }
};
function doToSession (callback) {
  if (SessionWindow.isVisible()) {
    callback();
  }
  else {
    SessionWindow.once('show', function () {
      callback();
    });
  }
};
// Make manifest linter
function lintManifest (manifeststr, path, retflag) {
  // Check for controller page
  try {
    let manifest = JSON.parse(manifeststr);
    if (!(typeof manifest.controller === "string" && fs.existsSync(path + manifest.controller) && fs.statSync(path + manifest.controller).isDirectory())) {
      console.log("Manifest controller invalid: " + path + manifest.controller);
      return false;
    }
    // Check for main page
    if (!(typeof manifest.main === "string" && fs.existsSync(path + manifest.main) && mime.getType(path + manifest.main) === "text/html")) {
      console.log("Manifest main invalid: " + path + manifest.main);
      return false;
    }
    // Check for max players
    if (typeof manifest.max !== undefined) {
      if (!(typeof manifest.max === "number")) {
        console.log("Manifest max invalid: " + manifest.max);
        return false;
      }
      if (manifest.max < 1) {
        manifest.max = Infinity;
      }
    }
    else {
      manifest.max = Infinity;
    }
    // Check for thumbnail
    if (manifest.thumbnail) {
      if (!(typeof manifest.thumbnail === "string" && fs.existsSync(path + manifest.thumbnail) && mime.getType(path + manifest.thumbnail).search("image") > -1)) {
        console.log("Manifest thumbnail invalid: " + path + manifest.thumbnail);
        return false;
      }
    }
    if (retflag) {
      return manifest;
    }
    else {
      return true;
    }
  }
  catch (e) {
    console.log("Manifest invalid", e);
    return false;
  }
};

app.on('ready', function () {
  Main = new BrowserWindow({
    fullscreen: true,
    frame: false,
    show: false,
    backgroundColor: "#242424",
    kosik: true
  });
  Main.on('ready-to-show', function () {
    Main.show();
  });
  Main.on('close', function () {
    Main = null;
    app.quit();
  });
  Main.loadURL(url.format({
    pathname: path.join(__dirname, 'main.html'),
    protocol: 'file',
    slashes: true
  }));

  (function setupMain () {
    ipcMain.on('command::start', function (e, game) {
      // Set Session
      Session = game;
      // Load manifest
      let manifest = lintManifest(fs.readFileSync(`./Games/${game}/.manifest`, 'utf-8'), `./Games/${game}/`, true);
      // Start SessionWindow
      SessionWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        show:false,
        backgroundColor: "#FFFFFF",
        kosik: true
      });
      SessionWindow.on('ready-to-show', function () {
        SessionWindow.show();
      });
      SessionWindow.on('close', function () {
        SessionWindow = null;
        Main.show();
        Session = null;
        SocketList.forEach(socket => {
          socket.emit('command::reload');
        });
      });
      // Load game html to Sessiom Window
      SessionWindow.loadURL(url.format({
        pathname: path.join(__dirname, "Games", Session, manifest.main),
        protocol: 'file',
        slashes: true
      }));
      // Hide Main
      Main.hide();
      // TODO Reload the Controllers
      SocketList.forEach(socket => {
        socket.emit('command::reload');
      });
    });
  })();
  ipcMain.on('command::stop', function () {
    if (Session) {
      Session = null;
      SessionWindow.close();
    }
  });
  ipcMain.on('player::getdata', function (e, socketid) {
    let soc = SocketList.find(n => n.id === socketid);
    if (soc) {
      soc.emit('player::getdata', Session);
    }
  });
  ipcMain.on('player::savedata', function (e, socketid, data) {
    let soc = SocketList.find(n => n.id === socketid);
    if (soc) {
      soc.emit('player::savedata', Session, data);
    }
  });

  // Controller Server
  Controller = http.createServer(function (req, res) {
    if (Session === null) {
      fs.readFile(path.join(__dirname, 'controller.html'), function (err, data) {
        if (err) {
          res.writeHead(500);
          res.end("Server Error");
        }
        else {
          res.writeHead(200, {
            'Content-Length': Buffer.byteLength(data),
            'Content-Type': mime.getType("controller.html")
          });
          res.end(data);
        }
      });
    }
    else {
      // Serve the game controller html
      // Make it a proper server from path join + gamename
      let URL = url.parse(req.url);
      if (URL.path[URL.path.length - 1] === "/")  URL.path += "index.html";
      if (/^\/modules\/(.+)/.test(URL.path)) {
        let p = /^\/modules\/(.+)/.exec(URL.path);
        fs.readFile('./modules/' + p[1], 'utf-8', function (err, data) {
          if (err) {
            res.writeHead(500);
            res.end("Server Error:\n\n" + err + "");
            return false;
          }
          else {
            res.writeHead(200, {
              'Content-Length': Buffer.byteLength(data),
              'Content-Type': mime.getType("./modules/" + p[1])
            });
            res.end(data);
            return true;
          }
        });
      }
      else {
        fs.readFile(`./Games/${Session}/${lintManifest(fs.readFileSync(`./Games/${Session}/.manifest`, 'utf-8'), `./Games/${Session}/`, true).controller}/${URL.path}`, function (err, data) {
          if (err) {
            res.writeHead(500);
            res.end("Server Error:\n\n" + err + ""); // TODO Add Socket support for reload & all
            return false;
          }
          else {
            res.writeHead(200, {
              'Content-Length': Buffer.byteLength(data),
              'Content-Type': mime.getType("./controller" + URL.path)
            });
            res.end(data);
            return true;
          }
        });
      }
    }
  });
  let io = socketio(Controller);
  io.on('connection', function (socket) {
    // Add notification systems & required buttonsIDEA
    if (SocketList.findIndex(s => {
      return s.id === socket.id
    }) === -1) {
      SocketList.push(socket);
        if (Session === null) {
          doToMain(function () {
            Main.webContents.send("controller::newplayer", socket.id);
            if (SocketList.length === 1) {
              Main.webContents.send("controller::occupied");
            }
          });
        }
        else {
          doToSession(function () {
            SessionWindow.webContents.send("controller::newplayer", socket.id);
            if (SocketList.length === 1) {
              SessionWindow.webContents.send("controller::occupied");
            }
          });
        }
    }
    socket.on('disconnecting', function () {
      if (SocketList.findIndex(s => s.id === socket.id) > -1) {
        SocketList.splice(SocketList.findIndex(s => s.id === socket.id), 1);
        if (Session === null) {
          doToMain(function () {
            Main.webContents.send("controller::playerexit", socket.id);
            if (SocketList.length === 0) {
              Main.webContents.send("controller::empty");
            }
          });
        }
        else {
          socket.emit('player::close', "You have been disconnected.");
          doToSession(function () {
            SessionWindow.webContents.send("controller::playerexit", socket.id);
            if (SocketList.length === 0) {
              SessionWindow.webContents.send("controller::empty");
            }
          });
        }
      }
    });
    if (Session === null) {
      // Connect Socket with default controller
      if (SocketList.length > 1) {
        socket.emit('controller::maxplayers');
        Main.webContents.send('controller::maxplayers');
        socket.disconnect(true);
      }
      // the player went up
      socket.on('up', function () {
        Main.webContents.send('up');
      });
      socket.on('down', function () {
        Main.webContents.send('down');
      });
      socket.on('select', function () {
        Main.webContents.send('select');
      });
    }
    else {
      // Connect Socket with controller
      if (SocketList.length > lintManifest(fs.readFileSync(`./Games/${Session}/.manifest`, 'utf-8'), `./Games/${Session}/`, true).max) {
        socket.emit('controller::maxplayers');
        SessionWindow.webContents.send('controller::maxplayers');
        socket.disconnect(true);
      }
      // Connect with game controller sockets
      socket.use((packet, next) => {
        let name = packet.shift();
        if (Session !== null) SessionWindow.webContents.send("action::" + name, socket.id, ...packet);
        next();
      });
    }
  });
  Controller.listen(9753, function (err) {
    if (err) throw err;
    if (Session === null) {
      doToMain(function () {
        Main.webContents.send("controller::start");
      });
    }
    else {
      doToSession(function () {
        SessionWindow.webContents.send("controller::start");
      });
    }
  });
});

app.on('quit', function () {
  SocketList.forEach(function (socket) {
    socket.emit('command::quitplayer');
  });
});
