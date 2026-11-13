import { createIpcProxy } from '@trezor/ipc-proxy';

import type { TrezorBlockchainApi } from './TrezorBlockchain';

export type {
    GetTrezorBlockchain,
    GetTrezorBlockchainDep,
    TrezorBlockchainApi,
    TrezorBlockchainSettings,
} from './TrezorBlockchain';
export type { BlockchainLinkSettings } from './data/coinInfo';

let ipcProxy: Promise<TrezorBlockchainApi> | undefined;

/** TrezorBlockchain of the desktop renderer, calling the one in the main process. */
export const TrezorBlockchain = new Proxy({} as TrezorBlockchainApi, {
    get: (_, name) => {
        // Not a thenable, so that a promise resolved with it doesn't call it.
        if (typeof name !== 'string' || name === 'then') return undefined;

        return async (...args: unknown[]) => {
            ipcProxy ??= createIpcProxy<TrezorBlockchainApi>('TrezorBlockchain');
            const proxy = await ipcProxy;

            return (proxy[name as keyof TrezorBlockchainApi] as (...params: unknown[]) => unknown)(
                ...args,
            );
        };
    },
});
