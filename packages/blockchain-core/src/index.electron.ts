import { ERRORS } from '@trezor/connect-common/src/constants';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { err } from '@trezor/type-utils';
import { promiseRaceWithSignal } from '@trezor/utils';

import type { MethodOptions, TrezorBlockchainApi } from './TrezorBlockchain';

export type {
    GetTrezorBlockchain,
    GetTrezorBlockchainDep,
    TrezorBlockchainApi,
    TrezorBlockchainSettings,
} from './TrezorBlockchain';
export type { BlockchainLinkSettings } from './data/coinInfo';
// The events stay in connect-common as long as Connect emits them too.
export * from '@trezor/connect-common/src/events/blockchain';
export type { BlockchainEstimatedFee, BlockchainEstimatedFeeLevel } from './api/estimateFee';

let ipcProxy: Promise<TrezorBlockchainApi> | undefined;

// Of the second arguments, only the options of a method are objects, `on` and `off` take a listener.
const isMethodOptions = (arg: unknown): arg is MethodOptions =>
    typeof arg === 'object' && arg !== null;

/** TrezorBlockchain of the desktop renderer, calling the one in the main process. */
export const TrezorBlockchain = new Proxy({} as TrezorBlockchainApi, {
    get: (_, name) => {
        // Not a thenable, so that a promise resolved with it doesn't call it.
        if (typeof name !== 'string' || name === 'then') return undefined;

        const call = async (...args: unknown[]) => {
            ipcProxy ??= createIpcProxy<TrezorBlockchainApi>('TrezorBlockchain');
            const proxy = await ipcProxy;

            return (proxy[name as keyof TrezorBlockchainApi] as (...params: unknown[]) => unknown)(
                ...args,
            );
        };

        return (...args: unknown[]) => {
            const [params, options] = args;

            // A signal can't be sent to the main process, so the renderer ends the call itself.
            return isMethodOptions(options)
                ? promiseRaceWithSignal(call(params), options.signal).catch(error =>
                      err(ERRORS.serializeError(error)),
                  )
                : call(...args);
        };
    },
});
