import { ipcMain } from 'electron';

import { isMacOs, isWindows } from '@trezor/env-utils';
import { IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import { BluetoothIpc, BluetoothIpcApi, BluetoothTransport } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

import type { ModuleInit } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

// Export module state and use it trezor-connect module to override init + setTransports params
// getTransport function is reassigned in onLoad, onQuit
type BluetoothModuleState = {
    getTransport: () => BluetoothTransport | undefined;
};

export const bluetoothModuleState: BluetoothModuleState = {
    getTransport: () => undefined,
};

export const init: ModuleInit = () => {
    const { logger } = global;

    let bluetoothProcess: BluetoothProcess | undefined;

    const getBluetoothProcess = async () => {
        if (!bluetoothProcess) {
            const [port] = await getFreePort();
            bluetoothProcess = new BluetoothProcess(port);
        }

        return bluetoothProcess;
    };

    const killBluetoothProcess = () => {
        if (bluetoothProcess) {
            bluetoothProcess.stop();
            bluetoothProcess = undefined;
        }
    };

    const desktopLogger: ConstructorParameters<typeof BluetoothTransport>[0]['logger'] = {
        info: (...args) => logger.info(SERVICE_NAME, args),
        debug: (...args) => logger.debug(SERVICE_NAME, args),
        log: (...args) => logger.debug(SERVICE_NAME, args),
        warn: (...args) => logger.warn(SERVICE_NAME, args),
        error: (...args) => logger.error(SERVICE_NAME, args),
    };

    const initBluetoothIpc = async () => {
        const btProcess = await getBluetoothProcess();
        await btProcess.start();

        return new BluetoothIpc({
            // @ts-expect-error TODO BluetoothIpc params will be added in upcoming PR
            url: btProcess.getUrl(),
            logger: desktopLogger,
        });
    };

    const getBluetoothTransport = () =>
        bluetoothProcess
            ? new BluetoothTransport({
                  id: 'BluetoothTransport',
                  url: bluetoothProcess.getUrl(),
                  logger: desktopLogger,
                  messages: {}, // will be added by @trezor/connect transport initialization
                  writeWithResponse: isMacOs(),
                  writeWithDelay: isWindows(),
              })
            : undefined;

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            let api: BluetoothIpc | undefined;
            const apiError = new Error('BluetoothIpc api not initialized');

            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);
                    if (method === 'init') {
                        api = await initBluetoothIpc();
                    }

                    if (!api) throw apiError;

                    if (method === 'dispose') {
                        killBluetoothProcess();
                    }

                    return (api[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `add listener ${eventName}`);
                    if (!api) throw apiError;

                    return api.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `remove listener ${eventName}`);
                    if (!api) throw apiError;

                    return api.removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'Bluetooth', proxyOptions);
    const onLoad = () => {
        bluetoothModuleState.getTransport = getBluetoothTransport;
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        unregisterProxy();
        killBluetoothProcess();
        bluetoothModuleState.getTransport = () => undefined;
    };

    return { onLoad, onQuit };
};
