/* eslint-disable @typescript-eslint/no-var-requires */
import { app, session, BrowserWindow, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
// @ts-ignore
import prepareNext from 'electron-next';
import * as path from 'path';
import * as url from 'url';
import * as electronLocalshortcut from 'electron-localshortcut';

const { isBridgeRunning, runBridgeProcess } = require('./bridge');

let mainWindow: BrowserWindow;
const PROTOCOL = 'file';
const src = isDev
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: PROTOCOL,
          slashes: true,
      });

const registerShortcuts = (window: BrowserWindow) => {
    // internally uses before-input-event, which should be safer than adding globalShortcut and removing it on blur event
    // https://github.com/electron/electron/issues/8491#issuecomment-274790124
    // https://github.com/electron/electron/issues/1334#issuecomment-310920998
    electronLocalshortcut.register(window, 'F5', () => {
        window.loadURL(src);
    });

    electronLocalshortcut.register(window, 'CommandOrControl+R', () => {
        window.loadURL(src);
    });

    electronLocalshortcut.register(window, 'CommandOrControl+Alt+I', () => {
        window.webContents.openDevTools();
    });
};

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
    const handleExternalLink = (event: Event, url: string) => {
        // TODO? url.startsWith('http:') || url.startsWith('https:');
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    };

    mainWindow.webContents.on('will-navigate', handleExternalLink);
    mainWindow.webContents.on('new-window', handleExternalLink);

    if (!isDev) {
        const filter = {
            urls: ['http://127.0.0.1:21325/*'],
        };

        if (session.defaultSession) {
            session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
                // @ts-ignore electron declares requestHeaders as an empty interface
                details.requestHeaders.Origin = 'https://electron.trezor.io';
                callback({ cancel: false, requestHeaders: details.requestHeaders });
            });

            // TODO: implement https://github.com/electron/electron/blob/master/docs/api/browser-window.md#event-unresponsive
            session.defaultSession.protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
                let url = request.url.substr(PROTOCOL.length + 1);
                url = path.join(__dirname, '../build/', url);
                // TODO: I don't believe this work
                // @ts-ignore
                callback({ path: url });
            });
        }

        registerShortcuts(mainWindow);
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

app.on('will-quit', () => {
    // try to unregister shortcuts
    try {
        electronLocalshortcut.unregisterAll(mainWindow);
    } catch (error) {
        // do nothing
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        init();
    }
});

app.on('browser-window-focus', (_event, win) => {
    // @ts-ignore
    if (isDev && !win.isDevToolsOpened()) {
        // @ts-ignore
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
