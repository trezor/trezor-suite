import path from 'path';
import url from 'url';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';

import { PROTOCOL } from '@lib/constants';
import * as store from '@lib/store';
import { MIN_HEIGHT, MIN_WIDTH } from '@lib/screen';
import Logger, { LogLevel, defaultOptions as loggerDefaults } from '@lib/logger';
import { buildInfo, computerInfo } from '@lib/info';
import modules from '@lib/modules';

let mainWindow: BrowserWindow;
const APP_NAME = 'Trezor Suite';
const src = isDev
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: PROTOCOL,
          slashes: true,
      });

// Logger
const log = {
    level: app.commandLine.getSwitchValue('log-level') || (isDev ? 'debug' : 'error'),
    writeToConsole: !app.commandLine.hasSwitch('log-no-print'),
    writeToDisk: app.commandLine.hasSwitch('log-write'),
    outputFile: app.commandLine.getSwitchValue('log-file') || loggerDefaults.outputFile,
    outputPath: app.commandLine.getSwitchValue('log-path') || loggerDefaults.outputPath,
};

const logger = new Logger(log.level as LogLevel, { ...log });

// Globals
global.logger = logger;
global.resourcesPath = isDev
    ? path.join(__dirname, '..', 'public', 'static')
    : process.resourcesPath;

logger.info('main', 'Application starting');

const init = async () => {
    buildInfo();
    await computerInfo();

    const winBounds = store.getWinBounds();
    logger.debug('init', `Create Browswer Window (${winBounds.width}x${winBounds.height})`);

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
        icon: path.join(global.resourcesPath, 'images', 'icons', '512x512.png'),
    });

    // Load page
    logger.debug('init', `Load URL (${src})`);
    mainWindow.loadURL(src);

    // Modules
    await modules({
        mainWindow,
        src,
        store,
    });
};

app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu
app.on('ready', init);

app.on('before-quit', () => {
    if (!mainWindow) return;
    mainWindow.removeAllListeners();
    logger.exit();
});

ipcMain.on('app/restart', () => {
    logger.info('main', 'App restart requested');
    app.relaunch();
    app.exit();
});
