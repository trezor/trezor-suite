import { app, session, BrowserWindow, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
import prepareNext from 'electron-next';
import * as path from 'path';
import * as url from 'url';
import * as electronLocalshortcut from 'electron-localshortcut';
import * as store from './store';
import { runBridgeProcess, killBridgeProcess } from './bridge';

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
        // TODO: not necessary since suite will send a request to start bridge via IPC
        // but right now removing it causes showing the download bridge modal for a sec
        await runBridgeProcess();
    } catch (error) {
        // do nothing
    }

    if (isDev) {
        await prepareNext(path.resolve(__dirname, '../'));
    }

    const winBounds = store.getWinBounds();
    mainWindow = new BrowserWindow({
        width: winBounds.width,
        height: winBounds.height,
        minWidth: store.MIN_WIDTH,
        minHeight: store.MIN_HEIGHT,
        webPreferences: {
            webSecurity: !isDev,
            allowRunningInsecureContent: isDev,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    mainWindow.removeMenu();

    if (process.platform === 'darwin') {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q (onBeforeQuit = true)
        mainWindow.on('close', event => {
            event.preventDefault();
            mainWindow.hide();
        });
    }

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
                callback(url);
            });
        }

        registerShortcuts(mainWindow);
    }

    mainWindow.loadURL(src);
};

app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit();
    // @ts-ignore
    mainWindow = undefined;
});

app.on('before-quit', async () => {
    // TODO: be aware that although it kills the bridge process, another one will start because of start-bridge msgs from ipc
    // (BridgeStatus component sends the request every time it loses transport.type)
    await killBridgeProcess();
    if (mainWindow) {
        // remove onclose listener
        mainWindow.removeAllListeners();
        // store window bounds
        store.setWinBounds(mainWindow);
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
    if (mainWindow) {
        mainWindow.show();
    } else {
        init();
    }
});

app.on('browser-window-focus', (_event, win) => {
    if (isDev && !win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools();
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
