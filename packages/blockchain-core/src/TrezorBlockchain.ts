import { ERRORS } from '@trezor/connect-common/src/constants';
import { type Result, err, ok } from '@trezor/type-utils';
import { TypedEmitter } from '@trezor/utils';

import { disconnect } from './api/disconnect';
import { type EstimateFeeMethod, estimateFee } from './api/estimateFee';
import { evmRpcCall } from './api/evmRpcCall';
import { evmRpcGetChainId } from './api/evmRpcGetChainId';
import { getAccountBalanceHistory } from './api/getAccountBalanceHistory';
import { getAccountInfo } from './api/getAccountInfo';
import { getContractInfo } from './api/getContractInfo';
import { getCurrentFiatRates } from './api/getCurrentFiatRates';
import { getDefaultBackend } from './api/getDefaultBackend';
import { getFiatRatesForTimestamps } from './api/getFiatRatesForTimestamps';
import { getInfo } from './api/getInfo';
import { type GetTransactionsMethod, getTransactions } from './api/getTransactions';
import { pushTransaction } from './api/pushTransaction';
import { setCustomBackend } from './api/setCustomBackend';
import { subscribe, unsubscribe } from './api/subscribe';
import { subscribeFiatRates } from './api/subscribeFiatRates';
import { unsubscribeFiatRates } from './api/unsubscribeFiatRates';
import type { PostMessage, Proxy } from './backend/Blockchain';
import { dispose as disposeBackends, setDebug, updateProxy } from './backend/BlockchainLink';
import { BLOCKCHAIN_EVENT, type BlockchainEvent, type BlockchainEventMessage } from './events';

export type TrezorBlockchainSettings = { debug?: boolean; proxy?: Proxy };

type TrezorBlockchainEvents = { [BLOCKCHAIN_EVENT]: BlockchainEventMessage } & {
    [E in BlockchainEvent as E['type']]: E['payload'];
};

/** The result of a backend function, or the error it threw. */
export type TrezorBlockchainResponse<T> = Promise<Result<T, ERRORS.SerializedError>>;

/** A backend function as TrezorBlockchain serves it. */
type Method<TFn extends (params: never, postMessage: PostMessage) => Promise<unknown>> = (
    params: Parameters<TFn>[0],
) => TrezorBlockchainResponse<Awaited<ReturnType<TFn>>>;

export type TrezorBlockchainApi = {
    updateSettings: (settings: TrezorBlockchainSettings) => Promise<void>;
    dispose: () => void;
    on: TypedEmitter<TrezorBlockchainEvents>['on'];
    off: TypedEmitter<TrezorBlockchainEvents>['off'];
    removeAllListeners: TypedEmitter<TrezorBlockchainEvents>['removeAllListeners'];
    getInfo: Method<typeof getInfo>;
    getDefaultBackend: Method<typeof getDefaultBackend>;
    setCustomBackend: Method<typeof setCustomBackend>;
    disconnect: Method<typeof disconnect>;
    subscribe: Method<typeof subscribe>;
    unsubscribe: Method<typeof unsubscribe>;
    subscribeFiatRates: Method<typeof subscribeFiatRates>;
    unsubscribeFiatRates: Method<typeof unsubscribeFiatRates>;
    getCurrentFiatRates: Method<typeof getCurrentFiatRates>;
    getFiatRatesForTimestamps: Method<typeof getFiatRatesForTimestamps>;
    getAccountBalanceHistory: Method<typeof getAccountBalanceHistory>;
    getAccountInfo: Method<typeof getAccountInfo>;
    getTransactions: GetTransactionsMethod;
    getContractInfo: Method<typeof getContractInfo>;
    estimateFee: EstimateFeeMethod;
    evmRpcCall: Method<typeof evmRpcCall>;
    evmRpcGetChainId: Method<typeof evmRpcGetChainId>;
    pushTransaction: Method<typeof pushTransaction>;
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
    getTransactions: method(getTransactions) as GetTransactionsMethod,
    getContractInfo: method(getContractInfo),
    estimateFee: method(estimateFee) as EstimateFeeMethod,
    evmRpcCall: method(evmRpcCall),
    evmRpcGetChainId: method(evmRpcGetChainId),
    pushTransaction: method(pushTransaction),
};
