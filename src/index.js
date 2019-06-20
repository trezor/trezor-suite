/* @flow */

import EventEmitter from 'events';
import { CustomError } from './constants/errors';
import { MESSAGES, RESPONSES } from './constants';
import { create as createDeferred } from './utils/deferred';
import type { BlockchainSettings, Deferred } from './types';
import * as ResponseTypes from './types/responses';
import * as MessageTypes from './types/messages';

export type { EstimateFeeOptions } from './types/messages';

const workerWrapper = (factory: string | Function): Worker => {
    if (typeof factory === 'function') return new factory();
    if (typeof factory === 'string' && typeof Worker !== 'undefined') return new Worker(factory);
    // use custom worker
    throw new CustomError('worker_not_found');
};

// initialize worker communication, raise error if worker not found
const initWorker = async (settings: BlockchainSettings): Promise<Worker> => {
    const dfd: Deferred<Worker> = createDeferred(-1);
    const worker = workerWrapper(settings.worker);

    if (typeof worker !== 'object' || typeof worker.postMessage !== 'function') {
        throw new CustomError('worker_invalid');
    }

    const timeout = setTimeout(() => {
        worker.onmessage = null;
        worker.onerror = null;
        dfd.reject(new CustomError('worker_timeout'));
    }, 30000);

    worker.onmessage = (message: any) => {
        if (message.data.type !== MESSAGES.HANDSHAKE) return;
        // eslint-disable-next-line no-param-reassign
        clearTimeout(timeout);
        delete settings.worker;
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
        const message = error.message
            ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}`
            : 'Worker handshake error';
        dfd.reject(new CustomError('worker_runtime', message));
    };

    return dfd.promise;
};

class BlockchainLink extends EventEmitter {
    settings: BlockchainSettings;

    messageId: number = 0;

    worker: Worker;

    deferred: Array<Deferred<any>> = [];

    constructor(settings: BlockchainSettings) {
        super();
        this.settings = settings;
    }

    async getWorker(): Promise<Worker> {
        if (!this.worker) {
            this.worker = await initWorker(this.settings);
            // $FlowIssue MessageEvent type
            this.worker.onmessage = this.onMessage.bind(this);
            // $FlowIssue ErrorEvent type
            this.worker.onerror = this.onError.bind(this);
        }
        return this.worker;
    }

    // Sending messages to worker
    __send: <R>(message: any) => Promise<R> = async message => {
        await this.getWorker();
        const dfd: Deferred<any> = createDeferred(this.messageId);
        this.deferred.push(dfd);
        this.worker.postMessage({ id: this.messageId, ...message });
        this.messageId++;
        return dfd.promise;
    };

    async connect() {
        return await this.__send({
            type: MESSAGES.CONNECT,
        });
    }

    async getInfo(): Promise<$ElementType<ResponseTypes.GetInfo, 'payload'>> {
        return await this.__send({
            type: MESSAGES.GET_INFO,
        });
    }

    async getBlockHash(): Promise<$ElementType<ResponseTypes.GetBlockHash, 'payload'>> {
        return await this.__send({
            type: MESSAGES.GET_BLOCK_HASH,
        });
    }

    async getAccountInfo(
        payload: $ElementType<MessageTypes.GetAccountInfo, 'payload'>
    ): Promise<$ElementType<ResponseTypes.GetAccountInfo, 'payload'>> {
        return await this.__send({
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload,
        });
    }

    async getAccountUtxo(
        payload: $ElementType<MessageTypes.GetAccountUtxo, 'payload'>
    ): Promise<$ElementType<ResponseTypes.GetAccountUtxo, 'payload'>> {
        return await this.__send({
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload,
        });
    }

    async getTransaction(
        payload: $ElementType<MessageTypes.GetTransaction, 'payload'>
    ): Promise<$ElementType<ResponseTypes.GetTransaction, 'payload'>> {
        return await this.__send({
            type: MESSAGES.ESTIMATE_FEE,
            payload,
        });
    }

    async estimateFee(
        payload: $ElementType<MessageTypes.EstimateFee, 'payload'>
    ): Promise<$ElementType<ResponseTypes.EstimateFee, 'payload'>> {
        return await this.__send({
            type: MESSAGES.ESTIMATE_FEE,
            payload,
        });
    }

    async subscribe(
        payload: $ElementType<MessageTypes.Subscribe, 'payload'>
    ): Promise<$ElementType<ResponseTypes.Subscribe, 'payload'>> {
        return await this.__send({
            type: MESSAGES.SUBSCRIBE,
            payload,
        });
    }

    async unsubscribe(
        payload: $ElementType<MessageTypes.Subscribe, 'payload'>
    ): Promise<$ElementType<ResponseTypes.Unsubscribe, 'payload'>> {
        return await this.__send({
            type: MESSAGES.UNSUBSCRIBE,
            payload,
        });
    }

    async pushTransaction(
        payload: $ElementType<MessageTypes.PushTransaction, 'payload'>
    ): Promise<$ElementType<ResponseTypes.PushTransaction, 'payload'>> {
        return await this.__send({
            type: MESSAGES.PUSH_TRANSACTION,
            payload,
        });
    }

    async disconnect(): Promise<boolean> {
        if (!this.worker) return true;
        return await this.__send({
            type: MESSAGES.DISCONNECT,
        });
    }

    // worker messages handler

    onMessage: (event: { data: ResponseTypes.Response }) => void = event => {
        if (!event.data) return;
        const { data } = event;

        if (data.id === -1) {
            this.onEvent(event);
            return;
        }

        const dfd = this.deferred.find(d => d.id === data.id);
        if (!dfd) {
            console.warn(`Message with id ${data.id} not found`);
            return;
        }
        if (data.type === RESPONSES.ERROR) {
            dfd.reject(new CustomError(data.payload.code, data.payload.message));
        } else {
            dfd.resolve(data.payload);
        }
        this.deferred = this.deferred.filter(d => d !== dfd);
    };

    onEvent: (event: { data: ResponseTypes.Response }) => void = event => {
        if (!event.data) return;
        const { data } = event;

        if (data.type === RESPONSES.CONNECTED) {
            this.emit('connected');
        } else if (data.type === RESPONSES.DISCONNECTED) {
            this.emit('disconnected');
        } else if (data.type === RESPONSES.ERROR) {
            this.emit('error', data.payload);
        } else if (data.type === RESPONSES.NOTIFICATION) {
            this.emit(data.payload.type, data.payload.payload);
        }
    };

    onNotification: (notification: any) => void = notification => {
        this.emit(notification.type, notification.payload);
    };

    onError: (error: { message: ?string, lineno: number, filename: string }) => void = error => {
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
        if (this.worker) {
            this.worker.terminate();
            delete this.worker;
        }
    }
}

export default BlockchainLink;
