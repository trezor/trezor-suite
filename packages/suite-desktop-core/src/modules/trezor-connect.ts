import { ipcMain } from 'electron';

import TrezorConnect, {
    type ConnectSettings,
    type ConnectSettingsTransport,
    type LocalFirmwares,
    UI_EVENT,
    UI_REQUEST,
    UI_RESPONSE,
} from '@trezor/connect';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { NodeUsbTransport, UdpTransport, createBridgeTransports } from '@trezor/transport';
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

/**
 * Desktop-side transport registry. The renderer sends serializable
 * `transportIds`; this registry maps them to real instances/constructors
 * before forwarding to TrezorConnect.init / updateConnectSettings (which
 * runs in this main process).
 */
type DesktopRegistryEntry = {
    id: string;
    factory: () => ConnectSettingsTransport | ConnectSettingsTransport[];
};

const desktopTransportRegistry = (): DesktopRegistryEntry[] => {
    const entries: DesktopRegistryEntry[] = [
        {
            id: 'BridgeTransport',
            factory: () => createBridgeTransports(),
        },
        { id: 'NodeUsbTransport', factory: () => NodeUsbTransport },
        { id: 'UdpTransport', factory: () => UdpTransport },
    ];

    const bluetooth = bluetoothModuleState.getTransport();
    if (bluetooth) {
        entries.push({ id: 'BluetoothTransport', factory: () => bluetooth });
    }

    return entries;
};

const resolveTransportsParam = (settings: {
    transportIds?: string[];
}): ConnectSettings['transports'] => {
    const registry = desktopTransportRegistry();
    const ids = settings.transportIds;
    const resolved = (ids?.length ? ids : ['BridgeTransport']).flatMap(id => {
        const entry = registry.find(r => r.id === id);
        if (!entry) return [];
        const result = entry.factory();

        return Array.isArray(result) ? result : [result];
    });

    // ensure Bluetooth is appended even if not selected explicitly,
    // mirroring previous behavior
    const bluetooth = bluetoothModuleState.getTransport();
    if (bluetooth && !resolved.includes(bluetooth)) {
        resolved.push(bluetooth);
    }

    return resolved;
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
                    settings.transports = resolveTransportsParam(settings);
                    delete settings.transportIds;

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
                    params[0].transports = resolveTransportsParam(params[0]);
                    delete params[0].transportIds;
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
