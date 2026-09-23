import { app } from 'electron';

import type { HandshakeClient } from '@suite/desktop-app-api';
import { isMacOs } from '@trezor/env-utils';
import { createDeferred, resolveAfter } from '@trezor/utils';

import { handshakeAndHangDetect } from './handshake-and-hang-detect';
import { ipcMain } from './ipcMain';
import { processStatePatch, restartApp } from './libs/app-utils';
import { isAutoStartEnabled, promptForAutoStartBeforeQuit } from './libs/auto-start';
import { APP_NAME } from './libs/constants';
import { createElectronSessionInterceptor } from './libs/create-electron-session-interceptor';
import { createMainWindow } from './libs/createMainWindow';
import { type PowerSaveBlocker } from './libs/createPowerSaveBlocker';
import { getBuildInfo, getComputerInfo } from './libs/info';
import { isMainWindowUsable } from './libs/isMainWindowUsable';
import { loadIndex } from './libs/loadIndex';
import { type MainWindowProxy } from './libs/main-window-proxy';
import { hasSwitch } from './libs/process-switches';
import { MIN_HEIGHT, MIN_WIDTH } from './libs/screen';
import { initSentry } from './libs/sentry';
import { Store } from './libs/store';
import { clearAppCache } from './libs/user-data';
import { initBackgroundModules, initModules } from './modules';
// todo: why is this separated here? shoudlnt it be part of modules?
import { initBioAuthModule } from './modules/bioAuthModule';
import { mainThreadEmitter } from './modules/module';
import { init as initTorModule } from './modules/tor';

type DesktopMainAppDeps = {
    logger: ILogger;
    mainWindowProxy: MainWindowProxy;
    powerSaveBlocker: PowerSaveBlocker;
    randomBytes: (size: number) => Buffer;
};

export type DesktopMainApp = () => Promise<void>;

export const createDesktopMainApp =
    (deps: DesktopMainAppDeps): DesktopMainApp =>
    async () => {
        deps.logger.info('main', `Application starting`);

        // https://www.electronjs.org/docs/all#apprequestsingleinstancelock
        const singleInstance = app.requestSingleInstanceLock();
        if (!singleInstance) {
            deps.logger.warn('main', 'Second instance detected, quitting...');
            app.quit();

            return;
        }

        const store = Store.getStore();

        const cspNonce = deps.randomBytes(16).toString('base64');

        initSentry({ store, mainThreadEmitter });

        app.name = APP_NAME; // overrides @suite/desktop-app app name in menu

        // App is launched via custom protocol (macOS)
        // It is called always when custom protocol is invoked but it only works when app is launching
        // It has to be outside app.on('ready') because 'will-finish-launching' event is called before 'ready' event
        app.on('will-finish-launching', () => {
            app.on('open-url', (event, url) => {
                event.preventDefault();

                deps.logger.debug(
                    'custom-protocols',
                    'App is launched via custom protocol (macOS)',
                );
                global.customProtocolUrl = url;
            });
        });

        app.on('web-contents-created', (_, contents) => {
            contents.on('will-navigate', (event, navigationUrl) => {
                // See: https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation

                deps.logger.error('electron', `Prevented unexpected redirect to: ${navigationUrl}`);
                event.preventDefault();
            });
        });

        ipcMain.on('app/restart', () => {
            deps.logger.info('main', 'App restart requested');
            mainThreadEmitter.emit('app/fully-quit');
            restartApp();
        });

        // workaround for Electron 36 on older linux distros, still not resolved in 37
        // https://github.com/electron/electron/issues/46538#issuecomment-2808806722
        app.commandLine.appendSwitch('gtk-version', '3');

        await app.whenReady();

        // Load bridge module first, it is required in both UI and daemon mode
        const interceptor = createElectronSessionInterceptor();
        const { loadModules: loadBackgroundModules, quitModules: quitBackgroundModules } =
            initBackgroundModules({
                mainWindowProxy: deps.mainWindowProxy,
                store,
                interceptor,
                mainThreadEmitter,
                cspNonce,
                powerSaveBlocker: deps.powerSaveBlocker,
            });

        // todo:
        // @ts-expect-error ClientHanshake is no longer any. But I can't make loadmodules inner the same type since it called sooner
        const backgroundModulesResponse = await loadBackgroundModules(undefined);

        // Daemon mode with no UI
        const { wasOpenedAtLogin } = app.getLoginItemSettings();
        const daemon = hasSwitch('bridge-daemon') || wasOpenedAtLogin;
        const daemonShowUI = hasSwitch('bridge-daemon-show-ui'); // show UI immediately even in daemon mode
        if (daemon && !daemonShowUI) {
            deps.logger.info('main', 'App is hidden, starting bridge only');
            app.dock?.hide(); // hide dock icon on macOS
            const waitForFullStart = createDeferred<void>();
            const handleFullStart = () => {
                // Initialize the UI when the second instance is opened
                deps.logger.warn('main', 'Second instance detected, initializing UI');
                app.dock?.show();
                waitForFullStart.resolve();
            };
            const openURL = (event: Electron.Event, url: string) => {
                // Handle deeplink in daemon mode
                event.preventDefault();
                deps.logger.warn('main', 'Custom protocol URL detected, initializing UI');
                global.customProtocolUrl = url;
                handleFullStart();
            };
            app.on('second-instance', handleFullStart);
            app.on('activate', handleFullStart);
            app.on('open-url', openURL);
            mainThreadEmitter.on('app/show', handleFullStart);
            await waitForFullStart.promise;
            app.off('second-instance', handleFullStart);
            app.off('activate', handleFullStart);
            app.off('open-url', openURL);
            mainThreadEmitter.off('app/show', handleFullStart);
        }

        // UI is opening
        const buildInfo = getBuildInfo();
        deps.logger.info('build', buildInfo);

        const computerInfo = getComputerInfo();
        deps.logger.debug('computer', computerInfo);

        const widthArg = parseInt(app.commandLine.getSwitchValue('width'), 10);
        const heightArg = parseInt(app.commandLine.getSwitchValue('height'), 10);
        const storedBounds = store.getWinBounds();
        const winBounds = {
            width: !isNaN(widthArg) ? Math.max(widthArg, MIN_WIDTH) : storedBounds.width,
            height: !isNaN(heightArg) ? Math.max(heightArg, MIN_HEIGHT) : storedBounds.height,
            x: storedBounds.x,
            y: storedBounds.y,
        };
        deps.logger.debug('init', `Create Browser Window (${winBounds.width}x${winBounds.height})`);

        // init modules
        const { loadModules, quitModules } = initModules({
            mainWindowProxy: deps.mainWindowProxy,
            store,
            interceptor,
            mainThreadEmitter,
            cspNonce,
            powerSaveBlocker: deps.powerSaveBlocker,
        });

        const reactivateWindow = () => {
            // Someone tried to run a second instance, we should focus our window.
            deps.logger.info('main', 'Second instance detected, focusing main window');
            let mainWindow = deps.mainWindowProxy.getInstance();
            if (!mainWindow || mainWindow.isDestroyed()) {
                deps.logger.info('main', 'Main window destroyed, recreating');
                mainWindow = createMainWindow({ winBounds, store, cspNonce });
                deps.mainWindowProxy.setInstance(mainWindow);
            }

            app.dock?.show();
            if (isMacOs()) app.show();
            //if (!mainWindow.isVisible())
            mainWindow.show();
            //if (mainWindow.isMinimized())
            mainWindow.restore();
            app.focus();
            mainWindow.moveTop();
            mainWindow.focus();
        };
        app.on('second-instance', reactivateWindow);
        mainThreadEmitter.on('app/show', reactivateWindow);
        // restore window after click on the macOS Dock icon
        if (process.platform === 'darwin') {
            app.on('activate', reactivateWindow);
        }

        // create handler for handshake/load-modules
        const loadModulesResponse = (clientData: HandshakeClient) =>
            loadModules(clientData)
                .then(modulesResponse => ({
                    success: true as const,
                    payload: { ...modulesResponse, ...backgroundModulesResponse },
                }))
                .catch(err => ({
                    success: false as const,
                    error: err.message,
                }));

        // repeated during app lifecycle (e.g. Ctrl+R)
        ipcMain.handle('handshake/load-modules', (_, payload) => {
            // one time back-wards compatibility migration from redux to electron store. this can be deleted after some time
            // storageLoadBioAuth should be removed as well
            if (
                typeof store.getBioAuthSettings().enabled === 'undefined' &&
                typeof payload.legacyBioAuthEnabled === 'boolean'
            ) {
                store.setBioAuthSettings({ enabled: payload.legacyBioAuthEnabled });
            }

            return loadModulesResponse(payload);
        });

        // Tor module initializes separated from general `initModules` because Tor is different
        // since it is allowed to fail and then the user decides whether to `try again` or `disable`.
        const { onLoad: loadTorModule, onQuit: quitTorModule } = initTorModule({
            mainWindowProxy: deps.mainWindowProxy,
            store,
            interceptor,
            mainThreadEmitter,
            cspNonce,
            powerSaveBlocker: deps.powerSaveBlocker,
        });

        const { onLoad: loadBioAuthModule, onQuit: quitBioAuthModule } = initBioAuthModule({
            mainWindowProxy: deps.mainWindowProxy,
            store,
        });

        ipcMain.handle('browser-window/reload', () => {
            deps.mainWindowProxy.getInstance()?.webContents.reload();
        });

        loadBioAuthModule();

        ipcMain.handle('handshake/load-tor-module', () => loadTorModule());

        let readyToQuit = false;
        let stoppingDaemon = false;
        mainThreadEmitter.on('app/fully-quit', () => {
            stoppingDaemon = true;
        });
        app.on('before-quit', async event => {
            if (readyToQuit) return;
            event.preventDefault();
            quitBioAuthModule();

            const mainWindow = deps.mainWindowProxy.getInstance();
            const windowExists =
                isMainWindowUsable(mainWindow) &&
                mainWindow.isClosable() &&
                (!isMacOs() || !app.isHidden());
            deps.logger.info('main', `Before quit, window exists: ${windowExists}`);

            if (windowExists) {
                const continued = await promptForAutoStartBeforeQuit(mainWindow, store);

                // Immediately hide the main window for the better closing UX.
                // For daemon mode, it doesn't matter.
                deps.logger.info('main', 'Hiding main window');
                // Check again after async/await call.
                if (isMainWindowUsable(mainWindow)) {
                    mainWindow.hide();
                }
                if (!continued) return;
            }

            const autoStartCurrentlyEnabled = isAutoStartEnabled();
            if (
                !stoppingDaemon &&
                autoStartCurrentlyEnabled &&
                (!isMacOs() || windowExists) // On Mac the window closing and app quitting are different
            ) {
                // Prevent quitting app when in daemon mode, unless the UI is already closed
                deps.logger.info('main', 'Preventing app quit in daemon mode');
                app.dock?.hide();
                if (isMainWindowUsable(mainWindow)) {
                    mainWindow.close();
                }

                return;
            }

            deps.logger.info('modules', 'Quitting all modules');
            await Promise.race([
                // await quitting all registered modules
                Promise.allSettled([quitModules(), quitTorModule(), quitBackgroundModules()]),
                // or timeout after 5s
                resolveAfter(5000),
            ]);

            // global cleanup
            deps.logger.info('modules', 'All modules quit, exiting');
            if (isMainWindowUsable(mainWindow)) {
                mainWindow.removeAllListeners();
            }
            deps.logger.exit();

            await resolveAfter(1000);

            readyToQuit = true;
            app.quit();
        });

        deps.mainWindowProxy.on('init', async mainWindow => {
            deps.logger.info('main', 'Main window initialized - calling handshake');
            const statePatch = processStatePatch();
            // load and wait for handshake message from renderer

            // Refresh if it failed to load
            mainWindow.webContents.on(
                'did-fail-load',
                (_event, errorCode, _desc, _url, isMainFrame) => {
                    // ERR_ABORTED (-3) fires when a new load cancels an in-progress one — ignore it to avoid an infinite loop.
                    // https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
                    if (!isMainFrame || errorCode === -3) return;
                    // Delay retry to avoid a busy loop if the failure persists.
                    setTimeout(() => {
                        // Main Suite window was closed, no point in loading index.
                        if (!isMainWindowUsable(mainWindow)) return;

                        loadIndex(mainWindow);
                    }, 1000);
                },
            );

            const { handshake, cleanup } = handshakeAndHangDetect({ mainWindow, statePatch });
            deps.mainWindowProxy.once('destroy', cleanup);
            const handshakeResult = await handshake;

            // handle hangDetect errors
            if (handshakeResult === 'quit') {
                deps.logger.info('hang-detect', 'Quitting app');
                readyToQuit = true;
                app.quit();

                return;
            }

            if (handshakeResult === 'reload') {
                deps.logger.info('hang-detect', 'Deleting cache');
                await clearAppCache().catch(err =>
                    deps.logger.error('hang-detect', `Couldn't clear cache: ${err.message}`),
                );
                restartApp();
            }
        });

        // Create main window last, so all listeners are set up
        deps.mainWindowProxy.setInstance(createMainWindow({ winBounds, store, cspNonce }));
    };
