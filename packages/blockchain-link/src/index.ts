import {
    createDeferred,
    createDeferredManager,
    createLazy,
    TypedEmitter,
    Throttler,
} from '@trezor/utils';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type { BlockchainSettings } from '@trezor/blockchain-link-types';
import type * as ResponseTypes from '@trezor/blockchain-link-types/src/responses';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type { Events } from '@trezor/blockchain-link-types/src/events';

const workerWrapper = (factory: BlockchainSettings['worker']): Worker | Promise<Worker> => {
    if (typeof factory === 'function') return factory();
    if (typeof factory === 'string' && typeof Worker !== 'undefined') return new Worker(factory);
    // use custom worker
    throw new CustomError('worker_not_found');
};

// initialize worker communication, raise error if worker not found
const initWorker = async (settings: BlockchainSettings) => {
    const dfd = createDeferred<Worker>(-1);
    const worker = await workerWrapper(settings.worker);

    if (typeof worker !== 'object' || typeof worker.postMessage !== 'function') {
        throw new CustomError('worker_invalid');
    }

    const timeout = setTimeout(() => {
        worker.onmessage = null;
        worker.onerror = null;
        dfd.reject(new CustomError('worker_timeout'));
    }, settings.timeout || 30000);

    worker.onmessage = (message: any) => {
        if (message.data.type !== MESSAGES.HANDSHAKE) return;
        clearTimeout(timeout);
        worker.postMessage({
            type: MESSAGES.HANDSHAKE,
            settings: Object.assign(settings, { worker: undefined }), // worker is not serialized
        });
        dfd.resolve(worker);
    };

    worker.onerror = (error: any) => {
        clearTimeout(timeout);
        worker.onmessage = null;
        worker.onerror = null;
        try {
            worker.terminate();
        } catch (error) {
            // empty
        }

        const message = error.message
            ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}`
            : 'Worker handshake error';
        dfd.reject(new CustomError('worker_runtime', message));
    };

    return dfd.promise;
};

class BlockchainLink extends TypedEmitter<Events> {
    settings: BlockchainSettings;

    private lazyWorker = createLazy(this.initWorker.bind(this), this.disposeWorker.bind(this));

    private deferred = createDeferredManager();

    private throttler: Throttler;

    constructor(settings: BlockchainSettings) {
        super();
        this.settings = settings;
        const throttleBlockEventTimeout =
            typeof settings.throttleBlockEvent === 'number' ? settings.throttleBlockEvent : 500;
        this.throttler = new Throttler(throttleBlockEventTimeout);
    }

    private async initWorker() {
        const worker = await initWorker(this.settings);
        worker.onmessage = this.onMessage.bind(this);
        worker.onerror = this.onError.bind(this);

        return worker;
    }

    private disposeWorker(worker: Worker) {
        worker.terminate();
    }

    // Sending messages to worker
    async sendMessage<R>(message: any): Promise<R> {
        const worker = await this.lazyWorker.getOrInit();
        const { promiseId, promise } = this.deferred.create();
        worker.postMessage({ id: promiseId, ...message });

        return promise;
    }

    connect(): Promise<boolean> {
        return this.sendMessage({
            type: MESSAGES.CONNECT,
        });
    }

    /** Get general information about the network, like current block-height, name, smallest possible division, etc. */
    getInfo(): Promise<ResponseTypes.GetInfo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_INFO,
        });
    }

    /** Get hash of a block of given height. */
    getBlockHash(
        payload: MessageTypes.GetBlockHash['payload'],
    ): Promise<ResponseTypes.GetBlockHash['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_BLOCK_HASH,
            payload,
        });
    }

    /** Get block of given height or hash */
    getBlock(
        payload: MessageTypes.GetBlock['payload'],
    ): Promise<ResponseTypes.GetBlock['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_BLOCK,
            payload,
        });
    }

    /** Get info about an account, eg. derived addresses, balance, transaction history etc. */
    getAccountInfo(
        payload: MessageTypes.GetAccountInfo['payload'],
    ): Promise<ResponseTypes.GetAccountInfo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload,
        });
    }

    /** Get unspent inputs for given account. Works only for bitcoin(like) networks. */
    getAccountUtxo(
        payload: MessageTypes.GetAccountUtxo['payload'],
    ): Promise<ResponseTypes.GetAccountUtxo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_UTXO,
            payload,
        });
    }

    /**
     * Get info about a given transaction.
     * Return value of this method is not identical across networks.
     * this method exposes raw response from the BE.
     */
    getTransaction(
        payload: MessageTypes.GetTransaction['payload'],
    ): Promise<ResponseTypes.GetTransaction['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_TRANSACTION,
            payload,
        });
    }

    getTransactionHex(
        payload: MessageTypes.GetTransactionHex['payload'],
    ): Promise<ResponseTypes.GetTransactionHex['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_TRANSACTION_HEX,
            payload,
        });
    }

    /**
     * Get historical progression of given account's balance
     * Used for rendering a graph in Suite's dashboard.
     */
    getAccountBalanceHistory(
        payload: MessageTypes.GetAccountBalanceHistory['payload'],
    ): Promise<ResponseTypes.GetAccountBalanceHistory['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_BALANCE_HISTORY,
            payload,
        });
    }

    getCurrentFiatRates(
        payload: MessageTypes.GetCurrentFiatRates['payload'],
    ): Promise<ResponseTypes.GetCurrentFiatRates['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_CURRENT_FIAT_RATES,
            payload,
        });
    }

    /** Get historical fiat rates. Only some backends support this. */
    getFiatRatesForTimestamps(
        payload: MessageTypes.GetFiatRatesForTimestamps['payload'],
    ): Promise<ResponseTypes.GetFiatRatesForTimestamps['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS,
            payload,
        });
    }

    /** Get fiat currencies for which rates are available. */
    getFiatRatesTickersList(
        payload: MessageTypes.GetFiatRatesTickersList['payload'],
    ): Promise<ResponseTypes.GetFiatRatesTickersList['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_FIAT_RATES_TICKERS_LIST,
            payload,
        });
    }

    /** Get ‘recommended’ fee value inferred from current traffic in the network. */
    estimateFee(
        payload: MessageTypes.EstimateFee['payload'],
    ): Promise<ResponseTypes.EstimateFee['payload']> {
        return this.sendMessage({
            type: MESSAGES.ESTIMATE_FEE,
            payload,
        });
    }

    rpcCall(payload: MessageTypes.RpcCall['payload']): Promise<ResponseTypes.RpcCall['payload']> {
        return this.sendMessage({
            type: MESSAGES.RPC_CALL,
            payload,
        });
    }

    /**
     * Subscribe for live changes in
     * - blockchain i.e new blocks mined.
     * - accounts, addresses i.e. new transactions broadcasted or mined.
     * - fiatRates
     * - connection to BE (CONNECT, DISCONNECT)
     *
     * Handling subscription state is left to the user. Hence the purpose of CONNECT and DISCONNECT notifications.
     */
    subscribe(
        payload: MessageTypes.Subscribe['payload'],
    ): Promise<ResponseTypes.Subscribe['payload']> {
        return this.sendMessage({
            type: MESSAGES.SUBSCRIBE,
            payload,
        });
    }

    /** Discard a subscription. */
    unsubscribe(
        payload: MessageTypes.Unsubscribe['payload'],
    ): Promise<ResponseTypes.Unsubscribe['payload']> {
        return this.sendMessage({
            type: MESSAGES.UNSUBSCRIBE,
            payload,
        });
    }

    /** Broadcast a transaction to the network. */
    pushTransaction(
        payload: MessageTypes.PushTransaction['payload'],
    ): Promise<ResponseTypes.PushTransaction['payload']> {
        return this.sendMessage({
            type: MESSAGES.PUSH_TRANSACTION,
            payload,
        });
    }

    // eslint-disable-next-line require-await
    async disconnect(): Promise<boolean> {
        if (!this.lazyWorker.get()) return true;

        return this.sendMessage({
            type: MESSAGES.DISCONNECT,
        });
    }

    // worker messages handler
    onMessage: (event: { data: ResponseTypes.Response }) => void = event => {
        if (!event.data) return;
        const { data } = event;

        if (data.id === -1) {
            this.onEvent(data);

            return;
        }

        if (data.type === RESPONSES.ERROR) {
            this.deferred.reject(data.id, new CustomError(data.payload.code, data.payload.message));
        } else {
            this.deferred.resolve(data.id, data.payload);
        }
    };

    onEvent: (data: ResponseTypes.Response) => void = data => {
        if (data.type === RESPONSES.CONNECTED) {
            this.emit('connected');
        }
        if (data.type === RESPONSES.DISCONNECTED) {
            this.emit('disconnected');
        }
        if (data.type === RESPONSES.NOTIFICATION) {
            const notification = data.payload;
            if (notification.type === 'block') {
                this.throttler.throttle('block', () => {
                    this.emit(notification.type, notification.payload);
                });
            } else if (notification.type === 'notification') {
                const txAccountId = `${notification.payload.descriptor}:${notification.payload.tx.txid}`;
                this.throttler.throttle(txAccountId, () => {
                    this.emit(notification.type, notification.payload);
                });
            } else {
                this.emit(notification.type, notification.payload);
            }
        }
    };

    onError: (error: { message?: string; lineno: number; filename: string }) => void = error => {
        const message = error.message
            ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}`
            : 'Worker handshake error';
        const e = new CustomError('worker_runtime', message);
        // reject all pending responses
        this.deferred.rejectAll(e);
    };

    dispose() {
        this.removeAllListeners();
        this.throttler.dispose();
        this.lazyWorker.dispose();
    }
}

export default BlockchainLink;

export type BlockchainLinkInterface = (typeof BlockchainLink)['prototype'];

export type BlockchainLinkParams<T extends keyof BlockchainLinkInterface> =
    BlockchainLinkInterface[T] extends (...args: any[]) => any
        ? Parameters<BlockchainLinkInterface[T]>[number]
        : never;

export type BlockchainLinkResponse<T extends keyof BlockchainLinkInterface> =
    BlockchainLinkInterface[T] extends (...args: any[]) => any
        ? ReturnType<BlockchainLinkInterface[T]> extends Promise<infer R>
            ? R
            : never
        : never;

// reexport types
export type { Message } from '@trezor/blockchain-link-types/src/messages';
export type {
    Response,
    BlockEvent,
    NotificationEvent,
    FiatRatesEvent,
} from '@trezor/blockchain-link-types/src/responses';
export type {
    Address,
    AccountAddresses,
    AccountInfo,
    AccountBalanceHistory,
    AnonymitySet,
    BlockchainSettings,
    FiatRatesBySymbol,
    ServerInfo,
    SubscriptionAccountInfo,
    Target,
    TokenInfo,
    TokenTransfer,
    InternalTransfer,
    Transaction,
    TransactionDetail,
    Utxo,
} from '@trezor/blockchain-link-types/src/common';
