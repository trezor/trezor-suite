import path from 'path';
import { app, BrowserWindow } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';
import type { HandshakeClient } from '@trezor/suite-desktop-api';

import { ipcMain } from './typed-electron';
import { APP_NAME } from './libs/constants';
import { Store } from './libs/store';
import { MIN_HEIGHT, MIN_WIDTH } from './libs/screen';
import { getBuildInfo, getComputerInfo } from './libs/info';
import { restartApp } from './libs/app-utils';
import { clearAppCache, initUserData } from './libs/user-data';
import { initSentry } from './libs/sentry';
import { initModules, mainThreadEmitter } from './modules';
import { init as initTorModule } from './modules/tor';
import { createInterceptor } from './libs/request-interceptor';
import { hangDetect } from './hang-detect';
import { Logger } from './libs/logger';

// @ts-expect-error using internal electron API to set suite version in dev mode correctly
if (isDevEnv) app.setVersion(process.env.VERSION);

global.resourcesPath = isDevEnv
    ? path.join(__dirname, '..', 'build', 'static')
    : process.resourcesPath;

const createMainWindow = (winBounds: WinBounds) => {
    const mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        webPreferences: {
            webSecurity: !isDevEnv,
            // experimentalFeatures: true,
            allowRunningInsecureContent: isDevEnv,
            preload: path.join(__dirname, 'preload.js'),
            // https://www.electronjs.org/blog/electron-20-0#default-changed-renderers-without-nodeintegration-true-are-sandboxed-by-default
            // Node.js required for sentry-ipc, suite-desktop-api
            sandbox: false,
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
            Store.getStore().setWinBounds(winBound);
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
    initUserData(); // has to be before initSentry and logger

    // Logger
    const logger = new Logger();
    global.logger = logger;

    logger.info('main', `Application starting`);

    // https://www.electronjs.org/docs/all#apprequestsingleinstancelock
    const singleInstance = app.requestSingleInstanceLock();
    if (!singleInstance) {
        logger.warn('main', 'Second instance detected, quitting...');
        app.quit();

        return;
    }

    const store = Store.getStore();

    initSentry({
        store,
        mainThreadEmitter,
    });

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
        restartApp();
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
    const loadModules = initModules({
        mainWindow,
        store,
        interceptor,
        mainThreadEmitter,
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

    // Tor module initializes separated from general `initModules` because Tor is different
    // since it is allowed to fail and then the user decides whether to `try again` or `disable`.
    const loadTorModule = initTorModule({
        mainWindow,
        store,
        interceptor,
        mainThreadEmitter,
    });

    ipcMain.handle('handshake/load-tor-module', () => loadTorModule());

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
        restartApp();
    }
};

init();
