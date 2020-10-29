import { app, session, BrowserWindow, ipcMain, shell, Menu, dialog } from 'electron';
import isDev from 'electron-is-dev';
import prepareNext from 'electron-next';
import { autoUpdater, CancellationToken } from 'electron-updater';
import * as path from 'path';
import * as url from 'url';
import * as electronLocalshortcut from 'electron-localshortcut';
import * as config from './config';
import * as store from './store';
import { buildMainMenu } from './menu';
import { HttpReceiver } from './http-receiver';
import * as metadata from './metadata';
import { buyRedirectHandler } from './buy';
import { RESOURCES } from './constants';

import BridgeProcess from './processes/BridgeProcess';

let initRun = false;
let mainWindow: BrowserWindow;
const APP_NAME = 'Trezor Suite';
const PROTOCOL = 'file';
const src = isDev
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: PROTOCOL,
          slashes: true,
      });

// Runtime flags
const disableCspFlag = app.commandLine.hasSwitch('disable-csp');
const preReleaseFlag = app.commandLine.hasSwitch('pre-release');

// Updater
const updateCancellationToken = new CancellationToken();

// External request handler
const httpReceiver = new HttpReceiver();

// Processes
const bridge = new BridgeProcess();

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

    // handle ctrl+r error in production build
    // ctrl+r used in route different than "/" will render an empty white page because of next.js routing
    // (file://wallet/ does not exists in the file system)
    mainWindow.webContents.on('did-fail-load', () => {
        mainWindow.loadURL(src);
    });
};

// notify client with window maximization state
const notifyWindowMaximized = (window: BrowserWindow) => {
    window.webContents.send(
        'window/is-maximized',
        process.platform === 'darwin' ? mainWindow.isFullScreen() : mainWindow.isMaximized(),
    );
};

// notify client with window active state
const notifyWindowActive = (window: BrowserWindow, state: boolean) => {
    window.webContents.send('window/is-active', state);
};

const init = async () => {
    try {
        await bridge.start();
    } catch {
        //
    }

    // On Mac, "init" is called again when the window is opened again. For this we need
    // to check if init has already run.
    if (isDev && !initRun) {
        await prepareNext(path.resolve(__dirname, '../'));
    }

    const winBounds = store.getWinBounds();
    mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        frame: false,
        minWidth: store.MIN_WIDTH,
        minHeight: store.MIN_HEIGHT,
        webPreferences: {
            webSecurity: !isDev,
            nativeWindowOpen: true,
            allowRunningInsecureContent: isDev,
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(RESOURCES, 'images', 'icons', '512x512.png'),
    });

    // Security warnings
    if (disableCspFlag) {
        dialog.showMessageBox({
            type: 'warning',
            message:
                'The application is running with CSP disabled. This is a security risk! If this is not intentional, please close the application immediately.',
            buttons: ['OK'],
        });
    }

    Menu.setApplicationMenu(buildMainMenu());
    mainWindow.setMenuBarVisibility(false);

    // open external links in default browser
    const handleExternalLink = (event: Event, url: string) => {
        if (config.oauthUrls.some(u => url.startsWith(u))) {
            event.preventDefault();
            return shell.openExternal(url);
        }
        // TODO? url.startsWith('http:') || url.startsWith('https:');
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            if (!config.allowedExternalUrls.some(u => url.startsWith(u))) {
                // TODO: Replace with in-app modal
                const result = dialog.showMessageBoxSync(mainWindow, {
                    type: 'warning',
                    message: `The following URL is going to be opened in your browser\n\n${url}`,
                    buttons: ['Cancel', 'Continue'],
                });
                // Cancel
                if (result === 0) return;
            }
            shell.openExternal(url);
        }
    };

    mainWindow.webContents.on('new-window', (event, url) => {
        handleExternalLink(event, url);
    });

    mainWindow.webContents.on('will-navigate', handleExternalLink);

    mainWindow.on('page-title-updated', evt => {
        // prevent updating window title
        evt.preventDefault();
    });

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

            if (!disableCspFlag) {
                session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                    callback({
                        responseHeaders: {
                            'Content-Security-Policy': [config.cspRules.join(';')],
                            ...details.responseHeaders,
                        },
                    });
                });
            }

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

    // Window controls
    ipcMain.on('window/close', () => {
        mainWindow.close();
    });
    ipcMain.on('window/minimize', () => {
        mainWindow.minimize();
    });
    ipcMain.on('window/maximize', () => {
        if (process.platform === 'darwin') {
            mainWindow.setFullScreen(true);
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('window/unmaximize', () => {
        if (process.platform === 'darwin') {
            mainWindow.setFullScreen(false);
        } else {
            mainWindow.unmaximize();
        }
    });
    ipcMain.on('client/ready', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('maximize', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('unmaximize', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('enter-full-screen', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('leave-full-screen', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('moved', () => {
        notifyWindowMaximized(mainWindow);
    });
    mainWindow.on('focus', () => {
        notifyWindowActive(mainWindow, true);
    });
    mainWindow.on('blur', () => {
        notifyWindowActive(mainWindow, false);
    });

    httpReceiver.start();

    // Updates (move in separate file)
    const updateSettings = store.getUpdateSettings();
    let latestVersion = {};

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = preReleaseFlag;

    if (updateSettings.skipVersion) {
        mainWindow.webContents.send('update/skip', updateSettings.skipVersion);
    }

    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('update/checking');
    });

    autoUpdater.on('update-available', ({ version, releaseDate }) => {
        latestVersion = { version, releaseDate };
        if (updateSettings.skipVersion === version) {
            return;
        }

        mainWindow.webContents.send('update/available', latestVersion);
    });

    autoUpdater.on('update-not-available', ({ version, releaseDate }) => {
        latestVersion = { version, releaseDate };
        mainWindow.webContents.send('update/not-available', latestVersion);
    });

    autoUpdater.on('error', err => {
        mainWindow.webContents.send('update/error', err);
    });

    autoUpdater.on('download-progress', progressObj => {
        mainWindow.webContents.send('update/downloading', { ...progressObj });
    });

    autoUpdater.on('update-downloaded', ({ version, releaseDate, downloadedFile }) => {
        mainWindow.webContents.send('update/downloaded', { version, releaseDate, downloadedFile });
    });

    ipcMain.on('update/check', () => autoUpdater.checkForUpdates());
    ipcMain.on('update/download', () => {
        mainWindow.webContents.send('update/downloading', {
            percent: 0,
            bytesPerSecond: 0,
            total: 0,
            transferred: 0,
        });
        autoUpdater.downloadUpdate(updateCancellationToken);
    });
    ipcMain.on('update/install', () => autoUpdater.quitAndInstall());
    ipcMain.on('update/cancel', () => {
        mainWindow.webContents.send('update/available', latestVersion);
        updateCancellationToken.cancel();
    });
    ipcMain.on('update/skip', (_, version) => {
        mainWindow.webContents.send('update/skip', version);
        updateSettings.skipVersion = version;
        store.setUpdateSettings(updateSettings);
    });

    // Init ran
    initRun = true;
};

app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu
app.on('ready', init);

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (mainWindow) {
        // remove onclose listener
        mainWindow.removeAllListeners();
        // store window bounds
        store.setWinBounds(mainWindow);

        //
        bridge.stop();
    }
});

app.on('will-quit', () => {
    // try to unregister shortcuts
    try {
        electronLocalshortcut.unregisterAll(mainWindow);
    } catch (error) {
        // do nothing
    }
    httpReceiver.stop();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (process.platform === 'darwin') {
        init();
    } else {
        mainWindow.show();
    }
});

app.on('browser-window-focus', (_event, win) => {
    if (isDev && !win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools();
    }
});

ipcMain.on('bridge/start', async (_event, devMode?: boolean) => {
    try {
        if (devMode) {
            await bridge.startDev();
        } else {
            await bridge.start();
        }
    } catch (error) {
        // TODO: return error message to suite?
    }
});

ipcMain.on('app/restart', () => {
    app.relaunch();
    app.exit();
});

// wait for httpReceiver to start accepting connections then register event handlers
httpReceiver.on('server/listening', () => {
    // when httpReceiver accepted oauth code
    httpReceiver.on('oauth/code', code => {
        mainWindow.webContents.send('oauth/code', code);
        app.focus();
    });

    httpReceiver.on('buy/redirect', url => {
        buyRedirectHandler(url, mainWindow, src);
    });

    // when httpReceiver was asked to provide current address for given pathname
    ipcMain.handle('server/request-address', (_event, pathname) =>
        httpReceiver.getRouteAddress(pathname),
    );
});

metadata.init();
