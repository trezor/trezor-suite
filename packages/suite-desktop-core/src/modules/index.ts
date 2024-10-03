import path from 'path';

import { isNotUndefined } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils';
import { InterceptedEvent } from '@trezor/request-manager';
import { isDevEnv } from '@suite-common/suite-utils';
import type { HandshakeClient, TorStatus } from '@trezor/suite-desktop-api';

import type { Store } from '../libs/store';
import * as eventLogging from './event-logging';
import * as eventLoggingProcess from './event-logging/process';
import * as eventLoggingApp from './event-logging/app';
import * as eventLoggingContents from './event-logging/contents';
import * as crashRecover from './crash-recover';
import * as menu from './menu';
import * as shortcuts from './shortcuts';
import * as requestFilter from './request-filter';
import * as externalLinks from './external-links';
import * as windowControls from './window-controls';
import * as theme from './theme';
import * as httpReceiverModule from './http-receiver';
import * as metadata from './metadata';
import * as customProtocols from './custom-protocols';
import * as autoUpdater from './auto-updater';
import * as store from './store';
import * as udevInstall from './udev-install';
import * as userData from './user-data';
import * as trezorConnect from './trezor-connect';
import * as devTools from './dev-tools';
import * as requestInterceptor from './request-interceptor';
import * as coinjoin from './coinjoin';
import * as csp from './csp';
import * as fileProtocol from './file-protocol';
import * as autoStart from './auto-start';
import { MainWindowProxy } from '../libs/main-window-proxy';

// General modules (both dev & prod)
const MODULES = [
    // Event Logging
    eventLogging,
    eventLoggingProcess,
    eventLoggingApp,
    eventLoggingContents,
    // Standard modules
    crashRecover,
    menu,
    shortcuts,
    requestFilter,
    externalLinks,
    windowControls,
    theme,
    httpReceiverModule,
    metadata,
    customProtocols,
    autoUpdater,
    store,
    udevInstall,
    userData,
    trezorConnect,
    devTools,
    requestInterceptor,
    coinjoin,
    autoStart,
    // Modules used only in dev/prod mode
    ...(isDevEnv ? [] : [csp, fileProtocol]),
];

// define events internally sent between modules
interface MainThreadMessages {
    'module/request-interceptor': InterceptedEvent;
    'module/reset-tor-circuits': Extract<InterceptedEvent, { type: 'CIRCUIT_MISBEHAVING' }>;
    'module/tor-status-update': TorStatus;
    'focus-window': void;
    'blur-window': void;
}
export const mainThreadEmitter = new TypedEmitter<MainThreadMessages>();
export type MainThreadEmitter = typeof mainThreadEmitter;

export type Dependencies = {
    mainWindowProxy: MainWindowProxy;
    store: Store;
    interceptor: RequestInterceptor;
    mainThreadEmitter: MainThreadEmitter;
};

type ModuleLoad = (payload: HandshakeClient) => any | Promise<any>;

type ModuleQuit = () => void | Promise<void>;

type ModuleInit = (
    dependencies: Dependencies,
) => { onLoad?: ModuleLoad; onQuit?: ModuleQuit } | void;

export type Module = ModuleInit;

export const initModules = (dependencies: Dependencies) => {
    const { logger } = global;

    logger.info('modules', `Initializing ${MODULES.length} modules`);

    const modulesToLoad: [(typeof MODULES)[number], ModuleLoad][] = [];
    const modulesToQuit: [(typeof MODULES)[number], ModuleQuit][] = [];

    MODULES.forEach(moduleToInit => {
        logger.debug('modules', `Initializing ${moduleToInit.SERVICE_NAME}`);
        try {
            const initModule: Module = moduleToInit.init;
            const { onLoad, onQuit } = initModule(dependencies) ?? {};
            if (onLoad) modulesToLoad.push([moduleToInit, onLoad]);
            if (onQuit) modulesToQuit.push([moduleToInit, onQuit]);
        } catch (err) {
            logger.error(
                'modules',
                `Couldn't initialize ${moduleToInit.SERVICE_NAME} (${err.toString()})`,
            );
        }
    });
    logger.info('modules', 'All modules initialized');

    const loadModules = (handshake: HandshakeClient) => {
        let loaded = 0;

        return Promise.all(
            modulesToLoad.map(async ([moduleToLoad, onLoad]) => {
                const moduleName = moduleToLoad.SERVICE_NAME;
                logger.debug('modules', `Loading ${moduleName}`);
                try {
                    const payload = await onLoad(handshake);
                    logger.debug('modules', `Loaded ${moduleName}`);
                    dependencies.mainWindowProxy
                        .getInstance()
                        ?.webContents.send('handshake/event', {
                            type: 'progress',
                            message: `${moduleName} loaded`,
                            progress: {
                                current: ++loaded,
                                total: modulesToLoad.length,
                            },
                        });

                    return [moduleName, payload] as const;
                } catch (err) {
                    logger.error('modules', `Couldn't load ${moduleName} (${err?.toString()})`);
                    dependencies.mainWindowProxy
                        .getInstance()
                        ?.webContents.send('handshake/event', {
                            type: 'error',
                            message: `${moduleToLoad} error`,
                        });

                    throw new Error(
                        `Check if there is another instance of the Suite app running. ${err}`,
                    );
                }
            }),
        )
            .then(results => Object.fromEntries(results.filter(isNotUndefined)))
            .then(
                ({
                    [customProtocols.SERVICE_NAME]: protocol,
                    [autoUpdater.SERVICE_NAME]: desktopUpdate,
                    [userData.SERVICE_NAME]: { dir: userDir },
                    [httpReceiverModule.SERVICE_NAME]: { url: httpReceiver },
                }) => ({
                    protocol,
                    desktopUpdate,
                    paths: { userDir, binDir: path.join(global.resourcesPath, 'bin') },
                    urls: { httpReceiver },
                }),
            );
    };

    const quitModules = () =>
        Promise.allSettled(
            modulesToQuit.map(async ([moduleToQuit, onQuit]) => {
                logger.info(moduleToQuit.SERVICE_NAME, 'Stopping (app quit)');
                await onQuit();
            }),
        );

    return { loadModules, quitModules };
};
