import path from 'path';
import url from 'url';
import { app, BrowserWindow, ipcMain, RelaunchOptions, session } from 'electron';
import { init as initSentry, ElectronOptions, IPCMode } from '@sentry/electron';

import { SENTRY_CONFIG } from '@suite-config';
import { isDev } from '@suite-utils/build';
import { PROTOCOL } from './libs/constants';
import * as store from './libs/store';
import { MIN_HEIGHT, MIN_WIDTH } from './libs/screen';
import Logger, { LogLevel, defaultOptions as loggerDefaults } from './libs/logger';
import { buildInfo, computerInfo } from './libs/info';
import { loadModules } from './modules';
import { createInterceptor } from './libs/request-interceptor';

let mainWindow: BrowserWindow | typeof undefined;
const APP_NAME = 'Trezor Suite';
const src = isDev
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: PROTOCOL,
          slashes: true,
      });

// @ts-ignore using internal electron API to set suite version in dev mode correctly
if (isDev) app.setVersion(process.env.VERSION);

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
    ? path.join(__dirname, '..', 'build', 'static')
    : process.resourcesPath;

// App is launched via custom protocol (macOS)
// It is called always when custom protocol is invoked but it only works when app is launching
// It has to be outside app.on('ready') because 'will-finish-launching' event is called before 'ready' event
app.on('will-finish-launching', () => {
    app.on('open-url', (event, url) => {
        event.preventDefault();

        global.logger.debug('custom-protocols', 'App is launched via custom protocol (macOS)');
        global.customProtocolUrl = url;
    });
});

logger.info('main', `Application starting`);

const init = async () => {
    buildInfo();
    await computerInfo();

    const winBounds = store.getWinBounds();
    logger.debug('init', `Create Browser Window (${winBounds.width}x${winBounds.height})`);

    mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        webPreferences: {
            webSecurity: !isDev,
            allowRunningInsecureContent: isDev,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(global.resourcesPath, 'images', 'icons', '512x512.png'),
    });

    // Load page
    logger.debug('init', `Load URL (${src})`);
    mainWindow.loadURL(src);

    let resizeDebounce: ReturnType<typeof setTimeout> | null = null;
    mainWindow.on('resize', () => {
        if (resizeDebounce) return;
        resizeDebounce = setTimeout(() => {
            resizeDebounce = null;
            if (!mainWindow) return;
            const winBound = mainWindow.getBounds() as WinBounds;
            store.setWinBounds(winBound);
            logger.debug('app', 'new winBounds saved');
        }, 1000);
    });
    mainWindow.on('closed', () => {
        if (resizeDebounce) {
            clearTimeout(resizeDebounce);
        }
    });

    const interceptor = createInterceptor();

    // Modules
    await loadModules({
        mainWindow,
        src,
        store,
        interceptor,
    });
};

// https://www.electronjs.org/docs/all#apprequestsingleinstancelock
const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
    logger.warn('main', 'Second instance detected, quitting...');
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu
    app.on('ready', init);
}

app.on('before-quit', () => {
    if (!mainWindow) return;
    mainWindow.removeAllListeners();
    logger.exit();
});

ipcMain.on('app/restart', () => {
    logger.info('main', 'App restart requested');
    const options: RelaunchOptions = {};
    options.args = process.argv.slice(1).concat(['--relaunch']);
    options.execPath = process.execPath;
    if (process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args.unshift('--appimage-extract-and-run');
    }
    app.relaunch(options);
    app.quit();
});

const sentryConfig: ElectronOptions = {
    ...SENTRY_CONFIG,
    ipcMode: IPCMode.Classic,
    getSessions: () => [session.defaultSession],
};

initSentry(sentryConfig);
