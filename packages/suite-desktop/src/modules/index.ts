/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { isNotUndefined } from '@trezor/utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { StrictBrowserWindow } from '../typed-electron';
import type { HandshakeClient } from '@trezor/suite-desktop-api';

// General modules (both dev & prod)
const MODULES = [
    // Event Logging
    'event-logging/process',
    'event-logging/app',
    'event-logging/contents',
    // Standard modules
    'crash-recover',
    'menu',
    'shortcuts',
    'request-filter',
    'external-links',
    'window-controls',
    'theme',
    'http-receiver',
    'metadata',
    'bridge',
    'custom-protocols',
    'auto-updater',
    'store',
    'udev-install',
    'user-data',
    'trezor-connect',
    'dev-tools',
    'request-interceptor',
    'coinjoin',
    // Modules used only in dev/prod mode
    ...(isDevEnv ? [] : ['csp', 'file-protocol']),
];

export type Dependencies = {
    mainWindow: StrictBrowserWindow;
    store: LocalStore;
    interceptor: RequestInterceptor;
};

type ModuleLoad = (payload: HandshakeClient) => any | Promise<any>;

type ModuleInit = (dependencies: Dependencies) => ModuleLoad | void;

export type Module = ModuleInit;

export const initModules = async (dependencies: Dependencies) => {
    const { logger } = global;

    logger.info('modules', `Initializing ${MODULES.length} modules`);

    const modules = await Promise.all(
        MODULES.map(async module => {
            logger.debug('modules', `Initializing ${module}`);
            try {
                const m = await require(`./modules/${module}`);
                const initModule: Module = m.default;
                const loadModule = initModule(dependencies);
                if (loadModule) {
                    return [module, loadModule] as const;
                }
            } catch (err) {
                logger.error('modules', `Couldn't initialize ${module} (${err.toString()})`);
            }
        }),
    );

    logger.info('modules', 'All modules initialized');

    const modulesToLoad = modules.filter(isNotUndefined);
    return (handshake: HandshakeClient) => {
        let loaded = 0;
        return Promise.all(
            modulesToLoad.map(async ([module, loadModule]) => {
                logger.debug('modules', `Loading ${module}`);
                try {
                    const payload = await loadModule(handshake);
                    logger.debug('modules', `Loaded ${module}`);
                    dependencies.mainWindow.webContents.send('handshake/event', {
                        type: 'progress',
                        message: `${module} loaded`,
                        progress: {
                            current: ++loaded,
                            total: modulesToLoad.length,
                        },
                    });
                    return [module, payload] as const;
                } catch (err) {
                    logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
                    dependencies.mainWindow.webContents.send('handshake/event', {
                        type: 'error',
                        message: `${module} error`,
                    });
                    throw err;
                }
            }),
        )
            .then(results => Object.fromEntries(results.filter(isNotUndefined)))
            .then(
                ({
                    'custom-protocols': protocol,
                    'auto-updater': desktopUpdate,
                    'user-data': { dir: userDir },
                    'http-receiver': { url: httpReceiver },
                }) => ({
                    protocol,
                    desktopUpdate,
                    paths: { userDir, binDir: path.join(global.resourcesPath, 'bin') },
                    urls: { httpReceiver },
                }),
            );
    };
};
