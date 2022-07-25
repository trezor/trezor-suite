import path from 'path';
import fs from 'fs';

import { app, BrowserWindow, RelaunchOptions, session } from 'electron';
import { init as initSentry, ElectronOptions, IPCMode } from '@sentry/electron';
import { ipcMain } from './typed-electron';

// @ts-ignore TODO fix
import { SENTRY_CONFIG } from '@suite-config';
import { isDev } from '@suite-utils/build';
import { APP_NAME } from './libs/constants';
import * as store from './libs/store';
import { MIN_HEIGHT, MIN_WIDTH } from './libs/screen';
import { getBuildInfo, getComputerInfo } from './libs/info';
import { initModules } from './modules';
import { createInterceptor } from './libs/request-interceptor';
import { hangDetect } from './hang-detect';
import { createLogger } from './logger';
import type { HandshakeClient } from '@trezor/suite-desktop-api';

// @ts-ignore using internal electron API to set suite version in dev mode correctly
if (isDev) app.setVersion(process.env.VERSION);

// Logger
const logger = createLogger();

// Globals
global.logger = logger;
global.resourcesPath = isDev
    ? path.join(__dirname, '..', 'build', 'static')
    : process.resourcesPath;

const clearAppCache = () =>
    new Promise<void>((resolve, reject) => {
        const appFolder = process.env.PKGNAME!.replace('/', path.sep);
        const cachePath = path.join(app.getPath('appData'), appFolder, 'Cache');
        fs.rm(cachePath, { recursive: true }, err => (err ? reject(err) : resolve()));
    });

const createMainWindow = (winBounds: WinBounds) => {
    const mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        webPreferences: {
            webSecurity: !isDev,
            allowRunningInsecureContent: isDev,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(global.resourcesPath, 'images', 'icons', '512x512.png'),
    });

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

    return mainWindow;
};

const init = async () => {
    logger.info('main', `Application starting`);

    // https://www.electronjs.org/docs/all#apprequestsingleinstancelock
    const singleInstance = app.requestSingleInstanceLock();
    if (!singleInstance) {
        logger.warn('main', 'Second instance detected, quitting...');
        app.quit();

        return;
    }

    const sentryConfig: ElectronOptions = {
        ...SENTRY_CONFIG,
        ipcMode: IPCMode.Classic,
        getSessions: () => [session.defaultSession],
    };

    initSentry(sentryConfig);

    app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu

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

    await app.whenReady();

    const buildInfo = getBuildInfo();
    logger.info('build', buildInfo);

    const computerInfo = await getComputerInfo();
    logger.debug('computer', computerInfo);

    const winBounds = store.getWinBounds();
    logger.debug('init', `Create Browser Window (${winBounds.width}x${winBounds.height})`);

    const mainWindow = createMainWindow(winBounds);

    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    });

    app.on('before-quit', () => {
        mainWindow.removeAllListeners();
        logger.exit();
    });

    // init modules
    const interceptor = createInterceptor();
    const loadModules = await initModules({
        mainWindow,
        store,
        interceptor,
    });

    // create handler for handshake/load-modules
    const loadModulesResponse = (clientData: HandshakeClient) =>
        loadModules(clientData)
            .then(payload => ({
                success: true as const,
                payload,
            }))
            .catch(err => ({
                success: false as const,
                error: err.message,
            }));

    // repeated during app lifecycle (e.g. Ctrl+R)
    ipcMain.handle('handshake/load-modules', (_, payload) => loadModulesResponse(payload));

    // load and wait for handshake message from renderer
    const handshake = await hangDetect(mainWindow);

    // handle hangDetect errors
    if (handshake === 'quit') {
        logger.info('hang-detect', 'Quitting app');
        app.quit();

        return;
    }

    if (handshake === 'reload') {
        logger.info('hang-detect', 'Deleting cache');
        await clearAppCache().catch(err =>
            logger.error('hang-detect', `Couldn't clear cache: ${err.message}`),
        );
        app.relaunch();
        app.quit();
    }
};

init();
