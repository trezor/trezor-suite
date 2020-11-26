import path from 'path';
import url from 'url';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';

// Libs
import { RESOURCES, PROTOCOL } from '@lib/constants';
import * as store from '@lib/store';
import { MIN_HEIGHT, MIN_WIDTH } from '@lib/screen';

// Modules
import csp from '@module/csp';
import autoUpdater from '@module/auto-updater';
import windowControls from '@module/window-controls';
import tor from '@module/tor';
import bridge from '@module/bridge';
import metadata from '@module/metadata';
import menu from '@module/menu';
import shortcuts from '@module/shortcuts';
import devTools from '@module/dev-tools';
import httpReceiver from '@module/http-receiver';
import requestFilter from '@module/request-filter';
import externalLinks from '@module/external-links';
import fileProtocol from '@module/file-protocol';

let mainWindow: BrowserWindow;
const APP_NAME = 'Trezor Suite';
const src = isDev
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: PROTOCOL,
          slashes: true,
      });

// Globals
global.quitOnWindowClose = false;

const init = async () => {
    const winBounds = store.getWinBounds();
    mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        frame: false,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
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

    // Load page
    mainWindow.loadURL(src);

    // Modules
    menu(mainWindow);
    shortcuts(mainWindow, src);
    requestFilter(mainWindow);
    externalLinks(mainWindow, store);
    windowControls(mainWindow, store);
    httpReceiver(mainWindow, src);
    metadata();
    await bridge();
    await tor(mainWindow, store);

    if (isDev) {
        // Dev only modules
        devTools(mainWindow);
    } else {
        // Prod only modules
        csp(mainWindow);
        fileProtocol(mainWindow, src);
        autoUpdater(mainWindow, store);
    }
};

app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu
app.on('ready', init);

app.on('before-quit', () => {
    if (!mainWindow) return;
    mainWindow.removeAllListeners();
});

ipcMain.on('app/restart', () => {
    app.relaunch();
    app.exit();
});
