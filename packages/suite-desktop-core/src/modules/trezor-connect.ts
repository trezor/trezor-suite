import { ipcMain } from 'electron';

import TrezorConnect, {
    type ConnectSettings,
    type LocalFirmwares,
    UI_EVENT,
    UI_REQUEST,
    UI_RESPONSE,
} from '@trezor/connect';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { parseElectrumUrl } from '@trezor/utils';

import { bluetoothModuleState } from './bluetooth';
import { getStoredFirmwares } from './firmware';
import { type MainThreadEmitter, type ModuleInit, type ModuleInitBackground } from './module';
import { APP_NAME } from '../libs/constants';
import { getComputerName } from '../libs/info';
import { PowerSaveBlocker } from '../libs/power-save-blocker';

export const SERVICE_NAME = '@trezor/connect';

type EmitOnSetCustomBackendToMainThreadToAllowDomainsParams = {
    params: Parameters<typeof TrezorConnect.blockchainSetCustomBackend>;
    mainThreadEmitter: MainThreadEmitter;
};

const emitOnSetCustomBackendToMainThreadToAllowDomains = ({
    params,
    mainThreadEmitter,
}: EmitOnSetCustomBackendToMainThreadToAllowDomainsParams) => {
    const param = params[0];

    if (param !== undefined && param.blockchainLink !== undefined) {
        const domains = (param.blockchainLink.url ?? []).map(url => {
            const electrumUrlResult = parseElectrumUrl(url);
            if (electrumUrlResult !== undefined) {
                return electrumUrlResult.host;
            }

            return new URL(url).hostname;
        });

        mainThreadEmitter.emit('module/request-interceptor', {
            type: 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS',
            coin: param.coin,
            domains,
        });
    }
};

// override TrezorConnect.init and TrezorConnect.updateConnectSettings params
// add BluetoothTransport if bluetooth module is enabled
const getTransportsParam = (
    transports?: ConnectSettings['transports'],
): ConnectSettings['transports'] => {
    const bluetooth = bluetoothModuleState.getTransport();
    if (!bluetooth) return transports;

    if (transports && transports.length > 0) {
        return [...transports, bluetooth];
    }

    // we don't want to break fallback in https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/TransportList.ts#L70
    return [bluetooth, 'BridgeTransport'];
};

export const initBackground: ModuleInitBackground = ({ mainThreadEmitter, store }) => {
    const { logger } = global;
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
            onRequest: async (method, params) => {
                logger.debug(SERVICE_NAME, `call ${method}`);
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
                    settings.transports = getTransportsParam(settings.transports);

                    const response = await TrezorConnect.init(settings);
                    await setProxy();

                    return response;
                }

                if (method === 'blockchainSetCustomBackend') {
                    emitOnSetCustomBackendToMainThreadToAllowDomains({ params, mainThreadEmitter });
                }

                if (method === 'firmwareUpdate') {
                    const powerSaveBlocker = new PowerSaveBlocker();
                    powerSaveBlocker.startBlockingPowerSave();
                    const response = await TrezorConnect.firmwareUpdate(params[0]);
                    powerSaveBlocker.stopBlockingPowerSave();

                    return response;
                }

                if (method === 'updateConnectSettings') {
                    params[0].transports = getTransportsParam(params[0].transports);
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

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'TrezorConnect', ipcProxyOptions);

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

        TrezorConnect.on(UI_EVENT, event => {
            const { type } = event;
            if (type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
                mainThreadEmitter.emit('module/trezor-connect/firmware-store', event.payload);
            }
        });
    };

    return { onLoad };
};
