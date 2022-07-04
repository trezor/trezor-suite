/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import { isNotUndefined } from '@trezor/utils';
import { isDev } from '@suite-utils/build';
import { StrictBrowserWindow } from '../typed-electron';

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
    'tor',
    'custom-protocols',
    'auto-updater',
    'store',
    'udev-install',
    'user-data',
    'trezor-connect-ipc',
    // Modules used only in dev/prod mode
    ...(isDev ? ['dev-tools'] : ['csp', 'file-protocol']),
];

export type Dependencies = {
    mainWindow: StrictBrowserWindow;
    store: LocalStore;
    interceptor: RequestInterceptor;
};

type ModuleLoad = () => any | Promise<any>;

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
    return () =>
        Promise.all(
            modulesToLoad.map(async ([module, loadModule]) => {
                logger.debug('modules', `Loading ${module}`);
                try {
                    const payload = await loadModule();
                    logger.debug('modules', `Loaded ${module}`);
                    return [module, payload] as const;
                } catch (err) {
                    logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
                }
            }),
        ).then(results => Object.fromEntries(results.filter(isNotUndefined)));
};
