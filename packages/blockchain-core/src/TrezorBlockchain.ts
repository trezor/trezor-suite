import {
    BLOCKCHAIN_EVENT,
    type BlockchainEvent,
    type BlockchainEventMessage,
    type Proxy,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { TrezorConnectBlockchain } from '@trezor/connect-common/src/types/api/blockchain';
import type { Response } from '@trezor/connect-common/src/types/params';
import { err, ok } from '@trezor/type-utils';
import { TypedEmitter } from '@trezor/utils';

import { disconnect } from './api/disconnect';
import { estimateFee } from './api/estimateFee';
import { evmRpcCall } from './api/evmRpcCall';
import { evmRpcGetChainId } from './api/evmRpcGetChainId';
import { getAccountBalanceHistory } from './api/getAccountBalanceHistory';
import { type GetAccountInfoParams, getAccountInfo } from './api/getAccountInfo';
import { getContractInfo } from './api/getContractInfo';
import { getCurrentFiatRates } from './api/getCurrentFiatRates';
import { getDefaultBackend } from './api/getDefaultBackend';
import { getFiatRatesForTimestamps } from './api/getFiatRatesForTimestamps';
import { getInfo } from './api/getInfo';
import { getTransactions } from './api/getTransactions';
import { pushTransaction } from './api/pushTransaction';
import { setCustomBackend } from './api/setCustomBackend';
import { subscribe, unsubscribe } from './api/subscribe';
import { subscribeFiatRates } from './api/subscribeFiatRates';
import { unsubscribeFiatRates } from './api/unsubscribeFiatRates';
import { dispose as disposeBackends, setDebug, updateProxy } from './backend/BlockchainLink';
import type { BlockchainLinkSettings } from './data/coinInfo';

export type TrezorBlockchainSettings = { debug?: boolean; proxy?: Proxy };

type TrezorBlockchainEvents = { [BLOCKCHAIN_EVENT]: BlockchainEventMessage } & {
    [E in BlockchainEvent as E['type']]: E['payload'];
};

type Api = TrezorConnectBlockchain;

export type TrezorBlockchainApi = {
    updateSettings: (settings: TrezorBlockchainSettings) => Promise<void>;
    dispose: () => void;
    on: TypedEmitter<TrezorBlockchainEvents>['on'];
    off: TypedEmitter<TrezorBlockchainEvents>['off'];
    removeAllListeners: TypedEmitter<TrezorBlockchainEvents>['removeAllListeners'];
    getInfo: Api['blockchainGetInfo'];
    getDefaultBackend: (params: { coin: string }) => Response<BlockchainLinkSettings | undefined>;
    setCustomBackend: Api['blockchainSetCustomBackend'];
    disconnect: Api['blockchainDisconnect'];
    subscribe: Api['blockchainSubscribe'];
    unsubscribe: Api['blockchainUnsubscribe'];
    subscribeFiatRates: Api['blockchainSubscribeFiatRates'];
    unsubscribeFiatRates: Api['blockchainUnsubscribeFiatRates'];
    getCurrentFiatRates: Api['blockchainGetCurrentFiatRates'];
    getFiatRatesForTimestamps: Api['blockchainGetFiatRatesForTimestamps'];
    getAccountBalanceHistory: Api['blockchainGetAccountBalanceHistory'];
    getAccountInfo: (
        params: GetAccountInfoParams,
    ) => Response<Awaited<ReturnType<typeof getAccountInfo>>>;
    getTransactions: Api['blockchainGetTransactions'];
    getContractInfo: Api['blockchainGetContractInfo'];
    estimateFee: Api['blockchainEstimateFee'];
    evmRpcCall: Api['blockchainEvmRpcCall'];
    evmRpcGetChainId: Api['blockchainEvmRpcGetChainId'];
    pushTransaction: Api['pushTransaction'];
};

/**
 * Reads TrezorBlockchain at call time, so the app chooses its implementation. The generic limits
 * each consumer to the methods it actually requires.
 */
export type GetTrezorBlockchain<TMethod extends keyof TrezorBlockchainApi> = () => Pick<
    TrezorBlockchainApi,
    TMethod
>;

export type GetTrezorBlockchainDep<TMethod extends keyof TrezorBlockchainApi> = {
    getTrezorBlockchain: GetTrezorBlockchain<TMethod>;
};

const emitter = new TypedEmitter<TrezorBlockchainEvents>();

const postMessage = (message: BlockchainEventMessage) => {
    emitter.emit(BLOCKCHAIN_EVENT, message);
    emitter.emit(message.type, message.payload);
};

const method =
    <P, T>(run: (params: P, post: typeof postMessage) => Promise<T>) =>
    async (params: P) => {
        try {
            return ok(await run(params, postMessage));
        } catch (error) {
            return err(ERRORS.serializeError(error));
        }
    };

/**
 * The blockchain backends of Trezor Suite. Lives next to Connect: in the same process on web and
 * mobile, in the main process on desktop.
 */
export const TrezorBlockchain: TrezorBlockchainApi = {
    updateSettings: async ({ debug, proxy }) => {
        if (debug !== undefined) setDebug(debug);
        await updateProxy(proxy);
    },
    dispose: () => {
        disposeBackends();
        emitter.removeAllListeners();
    },
    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args),
    removeAllListeners: (...args) => emitter.removeAllListeners(...args),
    getInfo: method(getInfo),
    getDefaultBackend: method(getDefaultBackend),
    setCustomBackend: method(setCustomBackend),
    disconnect: method(disconnect),
    subscribe: method(subscribe),
    unsubscribe: method(unsubscribe),
    subscribeFiatRates: method(subscribeFiatRates),
    unsubscribeFiatRates: method(unsubscribeFiatRates),
    getCurrentFiatRates: method(getCurrentFiatRates),
    getFiatRatesForTimestamps: method(getFiatRatesForTimestamps),
    getAccountBalanceHistory: method(getAccountBalanceHistory),
    getAccountInfo: method(getAccountInfo),
    // The overloads narrow the result by the params, which one implementation can't express.
    getTransactions: method(getTransactions) as Api['blockchainGetTransactions'],
    getContractInfo: method(getContractInfo),
    estimateFee: method(estimateFee) as Api['blockchainEstimateFee'],
    evmRpcCall: method(evmRpcCall),
    evmRpcGetChainId: method(evmRpcGetChainId),
    pushTransaction: method(pushTransaction),
};
