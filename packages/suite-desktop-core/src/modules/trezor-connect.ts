import { ipcMain } from 'electron';

import TrezorConnect, { DEVICE_EVENT } from '@trezor/connect';
import { IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { parseElectrumUrl } from '@trezor/utils';

import { getSwitchValue } from '../libs/process-switches';

import { MainThreadEmitter, ModuleInit, ModuleInitBackground } from './index';

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

export const initBackground: ModuleInitBackground = ({ mainThreadEmitter, store }) => {
    const { logger } = global;
    logger.info(SERVICE_NAME, `Starting service`);

    const setProxy = () => {
        const { running, host, port, externalPort, useExternalTor } = store.getTorSettings();
        const payload = running
            ? { proxy: `socks://${host}:${useExternalTor ? externalPort : port}` }
            : { proxy: '' };
        logger.info(SERVICE_NAME, `${running ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);

        return TrezorConnect.setProxy(payload);
    };

    const ipcProxyOptions: IpcProxyHandlerOptions<typeof TrezorConnect> = {
        onCreateInstance: () => ({
            onRequest: async (method, params) => {
                logger.debug(SERVICE_NAME, `call ${method}`);
                if (method === 'init') {
                    const response = await TrezorConnect.init({
                        ...params[0],
                        // poor mans solution to enable debug logs in trezor-connect.
                        // todo: ideally connect should accept logger as a param
                        debug: getSwitchValue('log-connect') === 'true',
                    });
                    await setProxy();

                    return response;
                }

                if (method === 'blockchainSetCustomBackend') {
                    emitOnSetCustomBackendToMainThreadToAllowDomains({ params, mainThreadEmitter });
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
        TrezorConnect.on(DEVICE_EVENT, event => {
            mainThreadEmitter.emit('module/trezor-connect/device-event', event);
        });
    };

    const onQuit = () => {
        unregisterProxy();
        TrezorConnect.dispose();
    };

    return { onLoad, onQuit };
};

export const init: ModuleInit = () => {
    const onLoad = () => {
        // reset previous instance, possible left over after renderer refresh (F5)
        TrezorConnect.dispose();
    };

    return { onLoad };
};
