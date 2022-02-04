/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
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
    'hang-detect',
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
];

// Modules only used in prod mode
const MODULES_PROD = ['csp', 'file-protocol'];

// Modules only used in dev mode
const MODULES_DEV = ['dev-tools'];

export type Dependencies = {
    mainWindow: StrictBrowserWindow;
    store: LocalStore;
    src: string;
    interceptor: RequestInterceptor;
};

export type Module = (dependencies: Dependencies) => any;

export const loadModules: Module = async dependencies => {
    const { logger } = global;

    logger.info('modules', `Loading ${MODULES.length} modules`);

    await Promise.all(
        [...MODULES, ...(isDev ? MODULES_DEV : MODULES_PROD)].flatMap(async module => {
            logger.debug('modules', `Loading ${module}`);

            try {
                const m = await require(`./modules/${module}`);
                return [m.default(dependencies)];
            } catch (err) {
                logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
            }
        }),
    );

    logger.info('modules', 'All modules loaded');
};
