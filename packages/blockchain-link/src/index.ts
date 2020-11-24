import { EventEmitter } from 'events';
import { CustomError } from './constants/errors';
import { MESSAGES, RESPONSES } from './constants';
import { create as createDeferred, Deferred } from './utils/deferred';
import { BlockchainSettings } from './types';
import * as ResponseTypes from './types/responses';
import * as MessageTypes from './types/messages';
import { Events } from './types/events';

interface Emitter {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
}

const workerWrapper = (factory: BlockchainSettings['worker']): Worker => {
    if (typeof factory === 'function') return factory();
    if (typeof factory === 'string' && typeof Worker !== 'undefined') return new Worker(factory);
    // use custom worker
    throw new CustomError('worker_not_found');
};

// initialize worker communication, raise error if worker not found
const initWorker = ({ worker: factory, ...settings }: BlockchainSettings) => {
    const dfd: Deferred<Worker> = createDeferred(-1);
    const worker = workerWrapper(factory);

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
            settings,
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

class BlockchainLink extends EventEmitter implements Emitter {
    settings: BlockchainSettings;

    messageId = 0;

    worker: Worker | undefined;

    deferred: Deferred<any>[] = [];

    constructor(settings: BlockchainSettings) {
        super();
        this.settings = settings;
    }

    async getWorker(): Promise<Worker> {
        if (!this.worker) {
            this.worker = await initWorker(this.settings);
            this.worker.onmessage = this.onMessage.bind(this);
            this.worker.onerror = this.onError.bind(this);
        }
        return this.worker;
    }

    // Sending messages to worker
    async sendMessage<R>(message: any): Promise<R> {
        const worker = await this.getWorker();
        const dfd = createDeferred(this.messageId);
        this.deferred.push(dfd);
        worker.postMessage({ id: this.messageId, ...message });
        this.messageId++;
        return dfd.promise as Promise<R>;
    }

    connect(): Promise<void> {
        return this.sendMessage({
            type: MESSAGES.CONNECT,
        });
    }

    getInfo(): Promise<ResponseTypes.GetInfo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_INFO,
        });
    }

    getBlockHash(
        payload: MessageTypes.GetBlockHash['payload']
    ): Promise<ResponseTypes.GetBlockHash['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_BLOCK_HASH,
            payload,
        });
    }

    getAccountInfo(
        payload: MessageTypes.GetAccountInfo['payload']
    ): Promise<ResponseTypes.GetAccountInfo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload,
        });
    }

    getAccountUtxo(
        payload: MessageTypes.GetAccountUtxo['payload']
    ): Promise<ResponseTypes.GetAccountUtxo['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_UTXO,
            payload,
        });
    }

    getTransaction(
        payload: MessageTypes.GetTransaction['payload']
    ): Promise<ResponseTypes.GetTransaction['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_TRANSACTION,
            payload,
        });
    }

    getAccountBalanceHistory(
        payload: MessageTypes.GetAccountBalanceHistory['payload']
    ): Promise<ResponseTypes.GetAccountBalanceHistory['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_ACCOUNT_BALANCE_HISTORY,
            payload,
        });
    }

    getCurrentFiatRates(
        payload: MessageTypes.GetCurrentFiatRates['payload']
    ): Promise<ResponseTypes.GetCurrentFiatRates['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_CURRENT_FIAT_RATES,
            payload,
        });
    }

    getFiatRatesForTimestamps(
        payload: MessageTypes.GetFiatRatesForTimestamps['payload']
    ): Promise<ResponseTypes.GetFiatRatesForTimestamps['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS,
            payload,
        });
    }

    getFiatRatesTickersList(
        payload: MessageTypes.GetFiatRatesTickersList['payload']
    ): Promise<ResponseTypes.GetFiatRatesTickersList['payload']> {
        return this.sendMessage({
            type: MESSAGES.GET_FIAT_RATES_TICKERS_LIST,
            payload,
        });
    }

    estimateFee(
        payload: MessageTypes.EstimateFee['payload']
    ): Promise<ResponseTypes.EstimateFee['payload']> {
        return this.sendMessage({
            type: MESSAGES.ESTIMATE_FEE,
            payload,
        });
    }

    subscribe(
        payload: MessageTypes.Subscribe['payload']
    ): Promise<ResponseTypes.Subscribe['payload']> {
        return this.sendMessage({
            type: MESSAGES.SUBSCRIBE,
            payload,
        });
    }

    unsubscribe(
        payload: MessageTypes.Unsubscribe['payload']
    ): Promise<ResponseTypes.Unsubscribe['payload']> {
        return this.sendMessage({
            type: MESSAGES.UNSUBSCRIBE,
            payload,
        });
    }

    pushTransaction(
        payload: MessageTypes.PushTransaction['payload']
    ): Promise<ResponseTypes.PushTransaction['payload']> {
        return this.sendMessage({
            type: MESSAGES.PUSH_TRANSACTION,
            payload,
        });
    }

    // eslint-disable-next-line require-await
    async disconnect(): Promise<boolean> {
        if (!this.worker) return true;
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

        const dfd = this.deferred.find(d => d.id === data.id);
        if (!dfd) {
            return;
        }
        if (data.type === RESPONSES.ERROR) {
            dfd.reject(new CustomError(data.payload.code, data.payload.message));
        } else {
            dfd.resolve(data.payload);
        }
        this.deferred = this.deferred.filter(d => d !== dfd);
    };

    onEvent: (data: ResponseTypes.Response) => void = data => {
        if (data.type === RESPONSES.CONNECTED) {
            this.emit('connected');
        }
        if (data.type === RESPONSES.DISCONNECTED) {
            this.emit('disconnected');
        }
        if (data.type === RESPONSES.NOTIFICATION) {
            this.emit(data.payload.type, data.payload.payload);
        }
    };

    onError: (error: { message?: string; lineno: number; filename: string }) => void = error => {
        const message = error.message
            ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}`
            : 'Worker handshake error';
        const e = new CustomError('worker_runtime', message);
        // reject all pending responses
        this.deferred.forEach(d => {
            d.reject(e);
        });
        this.deferred = [];
    };

    dispose() {
        this.removeAllListeners();
        const { worker } = this;
        if (worker) {
            worker.terminate();
            delete this.worker;
        }
    }
}

export default BlockchainLink;

export { Message } from './types/messages';
export { Response } from './types/responses';
export * from './types/common';
export * from './types/events';
