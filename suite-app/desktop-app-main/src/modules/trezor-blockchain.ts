import { TrezorBlockchain, type TrezorBlockchainApi } from '@trezor/blockchain-core';
import { createIpcProxyHandler } from '@trezor/ipc-proxy';
import { parseElectrumUrl } from '@trezor/utils';

import type { ModuleInit, ModuleInitBackground } from './module';
import { looselyTypedIpcMain } from '../ipcMain';
import { getSwitchValue } from '../libs/process-switches';

export const SERVICE_NAME = '@trezor/blockchain-core';

export const initBackground: ModuleInitBackground = ({ mainThreadEmitter, store, logger }) => {
    logger.info(SERVICE_NAME, `Starting service`);

    // The backends run in this (main) process, which owns their proxy. Until the Tor module sets the
    // current port, the saved one keeps the backends off the clearnet when Tor is enabled.
    const { running, host, port, externalPort, useExternalTor } = store.getTorSettings();
    TrezorBlockchain.updateSettings({
        proxy: { uri: running ? `socks://${host}:${useExternalTor ? externalPort : port}` : '' },
    });

    const unregisterProxy = createIpcProxyHandler<TrezorBlockchainApi>(
        looselyTypedIpcMain,
        'TrezorBlockchain',
        {
            onCreateInstance: () => ({
                onRequest: (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);

                    if (method === 'updateSettings') {
                        const [{ debug }] = params;

                        return TrezorBlockchain.updateSettings({
                            debug: debug || getSwitchValue('log-level') === 'debug',
                        });
                    }

                    if (method === 'setCustomBackend') {
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

                    if (method === 'evmRpcGetChainId') {
                        mainThreadEmitter.emit('module/request-interceptor', {
                            type: 'ADD_WHITELISTED_DOMAIN',
                            domain: new URL(params[0].url).hostname,
                        });
                    }

                    return (TrezorBlockchain[method] as (...args: any[]) => any)(...params);
                },
                onAddListener: (eventName, listener) => TrezorBlockchain.on(eventName, listener),
                onRemoveListener: eventName => TrezorBlockchain.removeAllListeners(eventName),
            }),
        },
    );

    const onQuit = () => {
        unregisterProxy();
        TrezorBlockchain.dispose();
    };

    return { onLoad: () => {}, onQuit };
};

export const init: ModuleInit = () => ({
    // Resets the backends possibly left over after a renderer refresh (F5).
    onLoad: () => TrezorBlockchain.dispose(),
});
