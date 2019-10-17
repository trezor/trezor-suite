/* eslint-disable @typescript-eslint/no-var-requires */
const { app, session, BrowserWindow, ipcMain, protocol, shell } = require('electron');
const isDev = require('electron-is-dev');
const prepareNext = require('electron-next');
const path = require('path');
const url = require('url');
const electronLocalshortcut = require('electron-localshortcut');
const { isBridgeRunning, runBridgeProcess } = require('./bridge');

let mainWindow;

const init = async () => {
    try {
        const isBridgeProcessRunning = await isBridgeRunning();
        if (!isBridgeProcessRunning) {
            await runBridgeProcess();
        }
    } catch (error) {
        // do nothing
    }

    if (isDev) {
        await prepareNext(path.resolve(__dirname, '../'));
    }

    mainWindow = new BrowserWindow({
        width: 980,
        height: 680,
        webPreferences: {
            webSecurity: !isDev,
            allowRunningInsecureContent: isDev,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    mainWindow.removeMenu();

    // open external links in default browser
    const handleExternalLink = (event, url) => {
        // TODO? url.startsWith('http:') || url.startsWith('https:');
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    };

    mainWindow.webContents.on('will-navigate', handleExternalLink);
    mainWindow.webContents.on('new-window', handleExternalLink);

    const PROTOCOL = 'file';
    const src = isDev
        ? 'http://localhost:8000/'
        : url.format({
              pathname: 'index.html',
              protocol: PROTOCOL,
              slashes: true,
          });

    if (!isDev) {
        const filter = {
            urls: ['http://127.0.0.1:21325/*'],
        };

        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            details.requestHeaders.Origin = 'https://electron.trezor.io';
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });

        // TODO: implement https://github.com/electron/electron/blob/master/docs/api/browser-window.md#event-unresponsive
        session.defaultSession.protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
            let url = request.url.substr(PROTOCOL.length + 1);
            url = path.join(__dirname, '../build/', url);
            callback({ path: url });
        });

        electronLocalshortcut.register(mainWindow, 'R', () => {
            mainWindow.loadURL(src);
        });

        electronLocalshortcut.register(mainWindow, 'F5', () => {
            mainWindow.loadURL(src);
        });

        electronLocalshortcut.unregisterAll(mainWindow);
    }

    mainWindow.loadURL(src);
};

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
    if (isDev && !win.isDevToolsOpened()) {
        win.openDevTools();
    }
});

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event, message) => {
    event.sender.send('message', message);
});

ipcMain.on('start-bridge', async () => {
    try {
        await runBridgeProcess();
    } catch (error) {
        // TODO: return error message to suite?
    }
});
