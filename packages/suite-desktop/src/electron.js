const { app, session, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const prepareNext = require('electron-next');
const path = require('path');
const url = require('url');

let mainWindow;

const init = async () => {
    await prepareNext(path.resolve(__dirname, '../'));

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const src = isDev
        ? 'http://localhost:8000/'
        : url.format({
              pathname: join(__dirname, '../index.html'),
              protocol: 'file:',
              slashes: true,
          });

    mainWindow.loadURL(src);
};

app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        init();
    }
});

app.on('browser-window-focus', function(event, win) {
    if (!win.isDevToolsOpened()) {
        win.openDevTools();
    }
});

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event, message) => {
    event.sender.send('message', message);
});
