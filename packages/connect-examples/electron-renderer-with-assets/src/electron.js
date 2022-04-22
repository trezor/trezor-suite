const { app, session, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');

let mainWindow;

function init() {
    // create browser window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 775,
    });

    const rendererSrc = isDev
        ? 'http://localhost:8080'
        : url.format({
              pathname: path.join(__dirname, '../build/index.html'),
              protocol: 'file',
              slashes: true,
          });

    mainWindow.loadURL(rendererSrc);

    if (!isDev) {
        // filter all requests to trezor-bridge and change origin
        // trezor-bridge does not accept origin "file://"
        const filter = {
            urls: ['http://127.0.0.1:21325/*'],
        };

        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            details.requestHeaders.Origin = 'https://electron.trezor.io';
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
    }

    // emitted when the window is closed.
    mainWindow.on('closed', () => {
        app.quit();

        mainWindow = null;
    });
}

app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        init();
    }
});

app.on('browser-window-focus', (event, win) => {
    if (!win.isDevToolsOpened()) {
        win.openDevTools();
    }
});
