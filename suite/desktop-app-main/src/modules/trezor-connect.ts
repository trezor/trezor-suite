import TrezorConnect, {
    type ConnectSettings,
    type ConnectSettingsTransport,
    type LocalFirmwares,
    UI_EVENTS,
    UI_RESPONSE,
} from '@trezor/connect';
import { initLog } from '@trezor/connect-common';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { NodeUsbTransport, UdpTransport } from '@trezor/transport';
import { BridgeTransport } from '@trezor/transport-common';
import { parseElectrumUrl } from '@trezor/utils';

import { bluetoothModuleState } from './bluetooth';
import { getStoredFirmwares } from './firmware';
import type { ModuleInit, ModuleInitBackground } from './module';
import { looselyTypedIpcMain } from '../ipcMain';
import { APP_NAME } from '../libs/constants';
import { getComputerName } from '../libs/info';
import { PowerSaveBlocker } from '../libs/power-save-blocker';
import { getSwitchValue } from '../libs/process-switches';

export const SERVICE_NAME = '@trezor/connect';

// `id` becomes the Bridge session owner shown to the user; it mirrors the desktop
// manifest's `appName` (see packages/suite/src/support/services.ts).
const TRANSPORT_ID = 'Trezor Suite desktop';
type CreateLogger = NonNullable<ConnectSettings['createLogger']>;

const createTransportParams = (createLogger: ConnectSettings['createLogger']) => ({
    id: TRANSPORT_ID,
    logger: createLogger?.('@trezor/transport'),
});

export const transportFactory = (
    t: unknown,
    createLogger?: CreateLogger,
): ConnectSettingsTransport | undefined => {
    if (typeof t !== 'string') return t as ConnectSettingsTransport;
    switch (t) {
        case 'BridgeTransport':
            return new BridgeTransport(createTransportParams(createLogger));
        case 'NodeUsbTransport':
            return new NodeUsbTransport(createTransportParams(createLogger));
        case 'UdpTransport':
            return new UdpTransport(createTransportParams(createLogger));
        default:
            return undefined;
    }
};

// override TrezorConnect.init and TrezorConnect.updateConnectSettings params:
// 1) translate legacy string transports to DI references (see above)
// 2) add BluetoothTransport if the bluetooth module is enabled
export const getTransportsParam = (
    rawTransports?: ConnectSettings['transports'],
    createLogger?: CreateLogger,
): ConnectSettings['transports'] => {
    const transports = rawTransports
        ?.map(transport => transportFactory(transport, createLogger))
        .filter((transport): transport is ConnectSettingsTransport => transport !== undefined);
    const bluetooth = bluetoothModuleState.getTransport();
    if (!bluetooth) return transports;

    if (transports && transports.length > 0) {
        return [...transports, bluetooth];
    }

    // If the caller did not pass any transports, restore the Bridge default
    // explicitly so we don't end up with a Bluetooth-only list.
    return [bluetooth, new BridgeTransport(createTransportParams(createLogger))];
};

export const initBackground: ModuleInitBackground = ({ mainThreadEmitter, store }) => {
    const { logger } = global;
    let createLogger: ConnectSettings['createLogger'];

    logger.info(SERVICE_NAME, `Starting service`);

    const setProxy = () => {
        const { running, host, port, externalPort, useExternalTor } = store.getTorSettings();
        const proxyUri = running ? `socks://${host}:${useExternalTor ? externalPort : port}` : '';
        const payload = { proxy: { uri: proxyUri } };

        logger.info(SERVICE_NAME, `${running ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);

        return TrezorConnect.updateConnectSettings(payload);
    };

    const ipcProxyOptions: IpcProxyHandlerOptions<typeof TrezorConnect> = {
        onCreateInstance: () => ({
            onRequest: async (...proxyArgs) => {
                logger.debug(SERVICE_NAME, `call ${proxyArgs[0]}`);

                const unwrap = (...args: typeof proxyArgs): typeof proxyArgs => {
                    // Unwrap 'call' method params, otherwise noop
                    if (args[0] === 'call') {
                        const { method, ...p } = args[1][0];

                        return [method, [p]] as typeof proxyArgs;
                    } else {
                        return args;
                    }
                };

                const [method, params] = unwrap(...proxyArgs);

                if (method === 'init') {
                    logger.info(SERVICE_NAME, `Retrieving stored firmwares`);
                    const [settings] = params;
                    const localFirmwares = await getStoredFirmwares();
                    if (settings.thp) {
                        // upgrade THP hostName with codesign (dev/local) suffix
                        settings.thp.appName = APP_NAME;
                        settings.thp.hostName = getComputerName();
                    }
                    if (localFirmwares.success) {
                        settings.localFirmwares = localFirmwares.payload;
                    }
                    // Core runs in this (main) process; the renderer cannot send a logger factory
                    // across IPC, so build it here from the serializable `debug` enabled hint.
                    // TODO(logger-unification): build from a unified app-wide logger instead of initLog.
                    settings.debug = settings.debug || getSwitchValue('log-level') === 'debug';
                    createLogger = (prefix: string) => initLog(prefix, !!settings.debug);
                    settings.createLogger = createLogger;
                    settings.transports = getTransportsParam(settings.transports, createLogger);

                    const response = await TrezorConnect.init(settings);
                    await setProxy();

                    return response;
                }

                if (method === 'blockchainSetCustomBackend') {
                    const { coin, blockchainLink: { url: urls } = {} } = params[0];
                    if (urls) {
                        const domains = urls.map(
                            url => parseElectrumUrl(url)?.host ?? new URL(url).hostname,
                        );

                        mainThreadEmitter.emit('module/request-interceptor', {
                            type: 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS',
                            coin,
                            domains,
                        });
                    }
                }

                if (method === 'blockchainEvmRpcGetChainId') {
                    const { url } = params[0];

                    mainThreadEmitter.emit('module/request-interceptor', {
                        type: 'ADD_WHITELISTED_DOMAIN',
                        domain: new URL(url).hostname,
                    });
                }

                if (method === 'firmwareUpdate') {
                    const powerSaveBlocker = new PowerSaveBlocker();
                    powerSaveBlocker.startBlockingPowerSave();
                    const response = await TrezorConnect.firmwareUpdate(params[0]);
                    powerSaveBlocker.stopBlockingPowerSave();

                    return response;
                }

                // Only rewrite transports when the caller actually sent some. An enabledNetworks-only
                // update (coin toggle / Cardano grant) carries no transports; injecting the bluetooth
                // fallback here would make `newTransports` defined in Core and trigger a needless
                // SET_TRANSPORTS → resetTransports → deviceList.init on every such update.
                if (method === 'updateConnectSettings' && params[0].transports !== undefined) {
                    params[0].transports = getTransportsParam(params[0].transports, createLogger);
                }

                return (TrezorConnect[method] as any)(...params);
            },
            onAddListener: (eventName, listener) => {
                logger.debug(SERVICE_NAME, `Add event listener ${eventName}`);

                return TrezorConnect.on(eventName, listener);
            },
            onRemoveListener: eventName => {
                logger.debug(SERVICE_NAME, `Remove event listener ${eventName}`);

                return TrezorConnect.removeAllListeners(eventName);
            },
        }),
    };

    const unregisterProxy = createIpcProxyHandler(
        looselyTypedIpcMain,
        'TrezorConnect',
        ipcProxyOptions,
    );

    const onLoad = () => {
        // TODO: doing nothing for now.
    };

    const onQuit = () => {
        unregisterProxy();
        TrezorConnect.dispose();
    };

    return { onQuit, onLoad };
};

export const init: ModuleInit = ({ mainThreadEmitter }) => {
    mainThreadEmitter.on('module/firmware/list', (event: LocalFirmwares) => {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_FIRMWARE,
            payload: event,
        });
    });

    const onLoad = () => {
        // reset previous instance, possible left over after renderer refresh (F5)
        TrezorConnect.dispose();

        // Subscribe to events afer dispose since `dispose` unsubscribes all of them.

        // TODO: This `DEVICE_EVENT` is currently not used, but it might be used to display events on tray.
        // TrezorConnect.on(DEVICE_EVENT, event => {
        //     mainThreadEmitter.emit('module/trezor-connect/device-event', event);
        // });

        TrezorConnect.on(UI_EVENTS.FIRMWARE_DOWNLOADED, event => {
            mainThreadEmitter.emit('module/trezor-connect/firmware-store', event);
        });
    };

    return { onLoad };
};
