import { app, session, BrowserWindow, ipcMain, shell, Menu, IpcMainEvent, dialog } from 'electron';
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
import TorProcess from './processes/TorProcess';

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
const torFlag = app.commandLine.hasSwitch('tor');
const bridgeDev = app.commandLine.hasSwitch('bridge-dev');

// Updater
const updateCancellationToken = new CancellationToken();

// External request handler
const httpReceiver = new HttpReceiver();

// Processes
const bridge = new BridgeProcess();
const tor = new TorProcess();

// Settings
const updateSettings = store.getUpdateSettings();
const torSettings = store.getTorSettings();

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
        if (bridgeDev) {
            await bridge.startDev();
        } else {
            await bridge.start();
        }
    } catch {
        //
    }

    if (isDev) {
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

    if (process.platform === 'darwin') {
        // macOS specific window behavior
        // it is common for applications and their context menu to stay active until the user quits explicitly
        // with Cmd + Q or right-click > Quit from the context menu.

        // restore window after click on the Dock icon
        app.on('activate', () => mainWindow.show());
        // hide window to the Dock
        // this event listener will be removed by app.on('before-quit')
        mainWindow.on('close', event => {
            event.preventDefault();
            mainWindow.hide();
        });
    } else {
        // other platform just kills the app
        app.on('window-all-closed', () => app.quit());
    }

    // open external links in default browser
    const handleExternalLink = (event: Event, url: string) => {
        if (config.oauthUrls.some(u => url.startsWith(u))) {
            event.preventDefault();
            return shell.openExternal(url);
        }
        // TODO? url.startsWith('http:') || url.startsWith('https:');
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            if (torSettings.running) {
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

    // TOR
    const sess = mainWindow.webContents.session;
    const toggleTor = async (start: boolean) => {
        if (start) {
            if (torSettings.running) {
                await tor.restart();
            } else {
                await tor.start();
            }
        } else {
            await tor.stop();
        }

        torSettings.running = start;
        store.setTorSettings(torSettings);

        mainWindow.webContents.send('tor/status', start);
        sess.setProxy({
            proxyRules: start ? `socks5://${torSettings.address}` : '',
        });
    };

    if (torFlag || torSettings.running) {
        await toggleTor(true);
    }

    ipcMain.on('tor/toggle', async (_, start: boolean) => {
        await toggleTor(start);
    });

    ipcMain.on('tor/set-address', () => async (_: IpcMainEvent, address: string) => {
        if (torSettings.address !== address) {
            torSettings.address = address;
            store.setTorSettings(torSettings);

            if (torSettings.running) {
                await toggleTor(true);
            }
        }
    });

    ipcMain.on('tor/get-status', () => {
        mainWindow.webContents.send('tor/status', torSettings.running);
    });

    ipcMain.handle('tor/get-address', () => {
        return torSettings.address;
    });

    const resourceTypeFilter = ['xhr']; // What resource types we want to filter
    const caughtDomainExceptions: string[] = []; // Domains that have already shown an exception
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
        if (!resourceTypeFilter.includes(details.resourceType)) {
            cb({ cancel: false });
            return;
        }

        const { hostname, protocol } = new URL(details.url);

        // Cancel requests that aren't allowed
        if (config.allowedDomains.find(d => hostname.endsWith(d)) === undefined) {
            if (caughtDomainExceptions.find(d => d === hostname) === undefined) {
                caughtDomainExceptions.push(hostname);
                dialog.showMessageBox(mainWindow, {
                    type: 'warning',
                    message: `Suite blocked a request to ${hostname}.\n\nIf you believe this is an error, please contact our support.`,
                    buttons: ['OK'],
                });
            }

            console.warn(`[Warning] Domain '${hostname}' was blocked.`);
            cb({ cancel: true });
            return;
        }

        // Redirect outgoing trezor.io requests to .onion domain
        if (torSettings.running && hostname.endsWith('trezor.io') && protocol === 'https:') {
            cb({
                redirectURL: details.url.replace(
                    /https:\/\/(([a-z0-9]+\.)*)trezor\.io(.*)/,
                    `http://$1${config.onionDomain}$3`,
                ),
            });
            return;
        }

        cb({ cancel: false });
    });

    // Window controls
    ipcMain.on('window/close', () => {
        // Keeping the devtools open might prevent the app from closing
        if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
        }
        // store window bounds on close btn click
        store.setWinBounds(mainWindow);
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
    if (!mainWindow) return;

    // remove onclose listener
    mainWindow.removeAllListeners();

    // unregister shortcuts
    // TODO: not sure if this try/catch is necessary.
    // it was needed before, when it was handled in 'will-quit' event and when mainWindow could be undefined (not anymore)
    try {
        electronLocalshortcut.unregisterAll(mainWindow);
    } catch (error) {
        // do nothing
    }

    // store window bounds on cmd/ctrl+q
    store.setWinBounds(mainWindow);

    // stop services
    bridge.stop();
    httpReceiver.stop();
});

app.on('browser-window-focus', (_event, win) => {
    if (isDev && !win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools();
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
