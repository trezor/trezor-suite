import { ipcMain } from 'electron';

import TrezorConnect, {
    type ConnectSettings,
    type ConnectSettingsTransport,
    type LocalFirmwares,
    UI_EVENT,
    UI_REQUEST,
    UI_RESPONSE,
} from '@trezor/connect';
import { initLog } from '@trezor/connect-common';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { BridgeTransport, NodeUsbTransport, UdpTransport } from '@trezor/transport';
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

    if (param?.blockchainLink !== undefined) {
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

// The Suite renderer's debug transport switcher writes string identifiers to
// Redux (`debug.transports`) and forwards them through IPC to this process.
// Strings serialize cleanly across IPC; classes don't — so the renderer
// cannot send DI references directly. We translate the legacy string
// names to the equivalent DI references here, below the IPC boundary, before
// they reach @trezor/connect.
//
// The renderer casts string transports through `ConnectSettings['transports']`
// (which is pure DI in connect's public type surface), so at this point the
// types claim no strings are present. The runtime knows better — we accept
// `unknown` here and narrow at runtime.
//
// 'WebUsbTransport' is intentionally not mapped — desktop never uses WebUSB.
// Any unmapped string that reaches @trezor/connect's TransportList will be
// rejected with a controlled `Runtime` error (`init({ transports }) entry is
// not a Transport instance or class`). On desktop the renderer UI only offers
// Bridge/NodeUsb/Udp, so this path is unreachable in practice.
export const mapStringTransport = (t: unknown): ConnectSettingsTransport => {
    if (typeof t !== 'string') return t as ConnectSettingsTransport;
    switch (t) {
        case 'BridgeTransport':
            return BridgeTransport;
        case 'NodeUsbTransport':
            return NodeUsbTransport;
        case 'UdpTransport':
            return UdpTransport;
        default:
            return t as unknown as ConnectSettingsTransport;
    }
};

// override TrezorConnect.init and TrezorConnect.updateConnectSettings params:
// 1) translate legacy string transports to DI references (see above)
// 2) add BluetoothTransport if the bluetooth module is enabled
export const getTransportsParam = (
    rawTransports?: ConnectSettings['transports'],
): ConnectSettings['transports'] => {
    const transports = rawTransports?.map(mapStringTransport);
    const bluetooth = bluetoothModuleState.getTransport();
    if (!bluetooth) return transports;

    if (transports && transports.length > 0) {
        return [...transports, bluetooth];
    }

    // If the caller did not pass any transports, restore the Bridge default
    // explicitly so we don't end up with a Bluetooth-only list.
    return [bluetooth, BridgeTransport];
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
                    // Core runs in this (main) process; the renderer cannot send a logger factory
                    // across IPC, so build it here from the serializable `debug` enabled hint.
                    // TODO(logger-unification): build from a unified app-wide logger instead of initLog.
                    settings.createLogger = (prefix: string) => initLog(prefix, !!settings.debug);

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
