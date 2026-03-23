import path from 'path';

import { isDevEnv } from '@suite-common/suite-utils';
import type { HandshakeClient } from '@trezor/suite-desktop-api';
import { isNotUndefined } from '@trezor/utils';

import * as autoStart from './auto-start';
import * as autoUpdater from './auto-updater';
import * as bluetooth from './bluetooth';
import * as bridge from './bridge';
import * as coinjoin from './coinjoin';
import * as crashRecover from './crash-recover';
import * as csp from './csp';
import * as customProtocols from './custom-protocols';
import * as devTools from './dev-tools';
import * as eventLogging from './event-logging';
import { type MainWindowProxy } from '../libs/main-window-proxy';
import * as eventLoggingApp from './event-logging/app';
import * as eventLoggingContents from './event-logging/contents';
import * as eventLoggingProcess from './event-logging/process';
import * as externalLinks from './external-links';
import * as firmware from './firmware';
import * as httpReceiverModule from './http-receiver';
import * as menu from './menu';
import * as metadata from './metadata';
import type {
    Dependencies,
    ModuleInit,
    ModuleInitBackground,
    ModuleLoad,
    ModuleQuit,
} from './module';
import * as powerMonitor from './power-monitor';
import * as requestFilter from './request-filter';
import * as requestInterceptor from './request-interceptor';
import * as safeStorage from './safeStorage';
import * as shortcuts from './shortcuts';
import * as store from './store';
import * as systemSettings from './system-settings';
import * as theme from './theme';
import * as tray from './tray';
import * as trezorConnect from './trezor-connect';
import * as userData from './user-data';
import * as windowControls from './window-controls';

// General modules (both dev & prod)

export * from './module';

const MODULES: Module[] = [
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
    metadata,
    customProtocols,
    autoUpdater,
    store,
    userData,
    trezorConnect,
    devTools,
    requestInterceptor,
    coinjoin,
    autoStart,
    bridge,
    systemSettings,
    safeStorage,
    bluetooth,
    firmware,
    powerMonitor,
    // Modules used only in dev/prod mode
    ...(isDevEnv ? [] : [csp]),
];

const MODULES_BACKGROUND: ModuleBackground[] = [bridge, trezorConnect, httpReceiverModule, tray];

export type Module = { SERVICE_NAME: string; init: ModuleInit };
export type ModuleBackground = { SERVICE_NAME: string; initBackground: ModuleInitBackground };

const initModulesInner = <
    B extends boolean,
    T extends ModuleBackground[] | Module[] = B extends true ? ModuleBackground[] : Module[],
>(
    dependencies: Omit<Dependencies, 'mainWindowProxy'> & { mainWindowProxy?: MainWindowProxy },
    background: B,
    modules: T,
) => {
    const { logger } = global;

    logger.info(
        'modules',
        `Initializing ${modules.length} ${background ? 'background ' : ''}modules`,
    );

    const modulesToLoad: [Module | ModuleBackground, ModuleLoad][] = [];
    const modulesToQuit: [Module | ModuleBackground, ModuleQuit][] = [];

    modules.forEach(moduleToInit => {
        logger.debug('modules', `Initializing ${moduleToInit.SERVICE_NAME}`);
        try {
            // @ts-expect-error
            const initModule = background ? moduleToInit.initBackground : moduleToInit.init;
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
    logger.info('modules', `All ${background ? 'background ' : ''}modules initialized`);

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
                        ?.getInstance()
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
                        ?.getInstance()
                        ?.webContents.send('handshake/event', {
                            type: 'error',
                            message: `${moduleToLoad} error`,
                        });

                    throw new Error(
                        `Check if there is another instance of the Suite app running. ${err}`,
                    );
                }
            }),
        ).then(results => Object.fromEntries(results.filter(isNotUndefined)));
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

export const initModules = (dependencies: Dependencies) => {
    const { loadModules: loadModulesInner, quitModules } = initModulesInner(
        dependencies,
        false,
        MODULES,
    );

    const loadModules = (handshake: HandshakeClient) =>
        loadModulesInner(handshake).then(
            ({
                [customProtocols.SERVICE_NAME]: protocol,
                [autoUpdater.SERVICE_NAME]: desktopUpdate,
                [userData.SERVICE_NAME]: { dir: userDir },
            }) => ({
                protocol,
                desktopUpdate,
                paths: { userDir, binDir: path.join(global.resourcesPath, 'bin') },
            }),
        );

    return { loadModules, quitModules };
};

export const initBackgroundModules = (dependencies: Dependencies) => {
    const { loadModules: loadModulesInner, quitModules } = initModulesInner(
        dependencies,
        true,
        MODULES_BACKGROUND,
    );

    const loadModules = (handshake: HandshakeClient) =>
        loadModulesInner(handshake).then(
            ({ [httpReceiverModule.SERVICE_NAME]: { url: httpReceiver } }) => ({
                urls: { httpReceiver },
            }),
        );

    return { loadModules, quitModules };
};
