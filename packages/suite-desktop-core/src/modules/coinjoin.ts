/**
 * Uses @trezor/coinjoin package in nodejs context
 */

import { app, ipcMain } from 'electron';
import { captureMessage, withScope } from '@sentry/electron';

import { coinjoinReportTag, coinjoinNetworkTag } from '@suite-common/sentry';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { CoinjoinClient, CoinjoinBackend, CoinjoinBackendSettings } from '@trezor/coinjoin';
import { getSynchronize } from '@trezor/utils';
import { getFreePort } from '@trezor/node-utils';
import { InterceptedEvent } from '@trezor/request-manager';

import { CoinjoinProcess } from '../libs/processes/CoinjoinProcess';
import { PowerSaveBlocker } from '../libs/power-save-blocker';
import { ThreadProxy } from '../libs/thread-proxy';

import type { Module } from './index';

export const SERVICE_NAME = '@trezor/coinjoin';

const CLIENT_CHANNEL = 'CoinjoinClient';
const BACKEND_CHANNEL = 'CoinjoinBackend';

export const init: Module = ({ mainWindow, store, mainThreadEmitter }) => {
    const { logger } = global;

    const backends: ThreadProxy<CoinjoinBackend>[] = [];
    const clients: CoinjoinClient[] = [];

    const synchronize = getSynchronize();

    let coinjoinProcess: CoinjoinProcess | undefined;

    const getCoinjoinProcess = async () => {
        if (!coinjoinProcess) {
            const port = await getFreePort();
            coinjoinProcess = new CoinjoinProcess(port);
        }

        return coinjoinProcess;
    };

    const killCoinjoinProcess = () => {
        if (coinjoinProcess) {
            coinjoinProcess.stop();
            coinjoinProcess = undefined;
        }
    };

    const sentryError = (network: string, payload: string) => {
        withScope(scope => {
            scope.clear(); // scope is also cleared in beforeSend sentry handler, this is just to be safe.
            scope.setTag(coinjoinReportTag, true);
            scope.setTag(coinjoinNetworkTag, network);
            captureMessage(payload, scope);
        });
    };

    const powerSaveBlocker = new PowerSaveBlocker();

    logger.debug(SERVICE_NAME, `Starting service`);

    const backendProxyOptions: IpcProxyHandlerOptions<CoinjoinBackend> = {
        onCreateInstance: async (settings: CoinjoinBackendSettings) => {
            const backend = new ThreadProxy<CoinjoinBackend>({
                name: 'coinjoin-backend',
                keepAlive: true,
            });

            await backend.run({ ...settings, torSettings: store.getTorSettings() });
            backends.push(backend);

            backend.on('interceptor', (event: InterceptedEvent) =>
                mainThreadEmitter.emit('module/request-interceptor', event),
            );

            backend.on('log', ({ level, payload }) => {
                if (level === 'error') {
                    sentryError(settings.network, payload);
                }
                (logger as any)[level](SERVICE_NAME, `${BACKEND_CHANNEL} ${payload}`);
            });

            const unsubscribeTorSettingsChange = store.onTorSettingsChange(torSettings =>
                backend.request('setTorSettings', [torSettings]),
            );

            backend.on('disposed', unsubscribeTorSettingsChange);

            return {
                onRequest: (method, params) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} call ${method}`);
                    if (method === 'disable') {
                        backend.dispose();
                        backends.splice(backends.indexOf(backend), 1);

                        return Promise.resolve();
                    }

                    return backend.request(method, params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} add listener ${eventName}`);

                    return backend.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} remove listener ${eventName}`);

                    return backend.removeAllListeners(eventName) as any;
                },
            };
        },
    };

    const clientProxyOptions: IpcProxyHandlerOptions<CoinjoinClient> = {
        onCreateInstance: async (settings: ConstructorParameters<typeof CoinjoinClient>[0]) => {
            const coinjoinMiddleware = await synchronize(getCoinjoinProcess);
            const port = coinjoinMiddleware.getPort();
            // override default url in coinjoin settings
            settings.middlewareUrl = coinjoinMiddleware.getUrl();
            const client = new CoinjoinClient(settings);
            client.on('log', ({ level, payload }) => {
                if (level === 'error') {
                    sentryError(settings.network, payload);
                }
                logger[level](SERVICE_NAME, `${CLIENT_CHANNEL} ${payload}`);
            });
            clients.push(client);

            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} call ${method}`);
                    if (method === 'enable') {
                        logger.debug(
                            SERVICE_NAME,
                            `${CLIENT_CHANNEL} binary enable on port ${port}`,
                        );
                        try {
                            await synchronize(() => coinjoinMiddleware.start());
                        } catch (err) {
                            logger.error(SERVICE_NAME, `Start failed: ${err.message}`);
                            throw err; // pass this error to suite toast
                        }
                    }
                    if (method === 'disable') {
                        clients.splice(clients.indexOf(client), 1);

                        if (clients.length === 0) {
                            logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} binary stop`);
                            synchronize(killCoinjoinProcess);
                        }
                        if (!clients.some(cli => cli.getAccounts().length > 0)) {
                            powerSaveBlocker.stopBlockingPowerSave();
                        }
                    }
                    if (method === 'registerAccount') {
                        powerSaveBlocker.startBlockingPowerSave();
                    }
                    if (method === 'unregisterAccount') {
                        if (!clients.some(cli => cli.getAccounts().length > 0)) {
                            powerSaveBlocker.stopBlockingPowerSave();
                        }
                    }

                    // needs type casting
                    return (client[method] as any)(...params); // bind method to instance context
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} add listener ${eventName}`);

                    return client.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} remove listener ${eventName}`);

                    return client.removeAllListeners(eventName);
                },
            };
        },
    };

    // `registerProxies` here serves (and is returned) as a module's "load" stage, but it
    // must be able to set the `unregisterProxies` fn in module's "init" stage closure, as
    // it's called from `dispose`, which is subscribed to events also in "init" stage

    let unregisterProxies = () => {};

    const registerProxies = () => {
        const unregisterBackendProxy = createIpcProxyHandler(
            ipcMain,
            BACKEND_CHANNEL,
            backendProxyOptions,
        );

        const unregisterClientProxy = createIpcProxyHandler(
            ipcMain,
            CLIENT_CHANNEL,
            clientProxyOptions,
        );

        unregisterProxies = () => {
            unregisterBackendProxy();
            unregisterClientProxy();
        };
    };

    const dispose = () => {
        backends.forEach(b => b.dispose());
        backends.splice(0, backends.length);

        clients.forEach(cli => {
            // emit unexpected app close before disabling the client
            if (cli.getRoundsInCriticalPhase().length > 0) {
                cli.emit('log', {
                    level: 'error',
                    payload: 'Suite closed in critical phase',
                });
            }
            cli.disable();
        });
        clients.splice(0, clients.length);

        unregisterProxies();
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        synchronize(killCoinjoinProcess);
        powerSaveBlocker.stopBlockingPowerSave();
    };

    app.on('before-quit', dispose);
    mainWindow.webContents.on('did-start-loading', dispose);
    ipcMain.once('app/restart', dispose);

    return registerProxies;
};
