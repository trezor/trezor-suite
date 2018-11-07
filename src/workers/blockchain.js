/* @flow */

import EventEmitter from 'events';

import { create as createDeferred } from '../utils/deferred';

import { MESSAGES, RESPONSES } from '../constants';
import type { 
    BlockchainSettings,
    Response,
    Deferred,
} from '../types';

// extend settings, allow user to pass string OR array
type ExtendedBlockchainSettings = {
    name: string,
    worker: string,
    server: string | Array<string>;
    debug?: boolean,
}

const instances: Array<Blockchain<any>> = [];

const __createInstance = (settings: ExtendedBlockchainSettings) => {
    const transformedSettings: BlockchainSettings = {
        name: settings.name,
        worker: settings.worker,
        server: typeof settings.server === 'string' ? [ settings.server ] : settings.server,
        debug: settings.debug,
    }
    const instance = instances.find(i => i.settings.name === settings.name);
    if (!instance) {
        const i: Blockchain<any> = new Blockchain(transformedSettings)
        instances.push(i);
    } else {
        console.warn(`Blockchain instance with name: ${settings.name} already exists.`)
    }
}

export const createInstance = (settings: ExtendedBlockchainSettings | Array<ExtendedBlockchainSettings>): void => {
    if (Array.isArray(settings)) {
        settings.forEach(__createInstance)
    } else {
        __createInstance(settings);
    }
}

export const getInstance: <T: Object>(name: string) => Blockchain<T> = (name) => {
    const instance = instances.find(i => i.settings.name === name);
    if (!instance) throw new Error(`Instance for "${name}" not found`);
    return instance;
}

const initWorker = async (settings: BlockchainSettings): Promise<Worker> => {
    const dfd: Deferred<Worker> = createDeferred(-1);
    const worker = new Worker(settings.worker);
    worker.onmessage = (message: any) => {
        if (message.data.type !== MESSAGES.HANDSHAKE) return;
        worker.postMessage({
            type: MESSAGES.HANDSHAKE,
            settings,
        });
        dfd.resolve(worker);
    }

    worker.onerror = (error: any) => {
        worker.onmessage = null;
        worker.onerror = null;
        const msg = error.message ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}` : 'Worker handshake error';
        dfd.reject(new Error(msg));
    }
    
    return dfd.promise;
}

// function send<M, R>(instance: Blockchain<any>, message: any): Promise<any> {
// // const send: <M, R>(instance: Blockchain<any>, message: M) => Promise<R> = (instance, message) => {
//     const dfd: Deferred<R> = createDeferred(instance.messageId);
//     instance.deferred.push(dfd);
//     instance.worker.postMessage({ id: instance.messageId, ...message });
//     instance.messageId++;
//     return dfd.promise;
// }

export class Blockchain<Instance: Object> extends EventEmitter {
    settings: BlockchainSettings;
    messageId: number = 0;
    worker: Worker;
    deferred: Array<Deferred<any>> = [];
    notificationHandler: (event: any) => void;

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
    // this needs to be written in different syntax because of flow has issue with passing generic type down into function body [Deferred<R>]
    // __send = async function<R>(message: any): Promise<R> {
    __send: <R>(message: any) => Promise<R> = async (message) => {
        await this.getWorker();
        const dfd: Deferred<any> = createDeferred(this.messageId);
        this.deferred.push(dfd);
        this.worker.postMessage({ id: this.messageId, ...message });
        this.messageId++;
        return dfd.promise;
    }

    getInfo: $ElementType<Instance, 'getInfo'> = async () => {
        return await this.__send({
            type: MESSAGES.GET_INFO,
        });
    }

    getAccountInfo: $ElementType<Instance, 'getAccountInfo'> = async (payload) => {
        return await this.__send({
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload
        });
    }

    subscribe: $ElementType<Instance, 'subscribe'> = async (payload) => {
        // delete message.payload.notificationHandler;
        return await this.__send({
            type: MESSAGES.SUBSCRIBE,
            payload
        });
    }

    unsubscribe: $ElementType<Instance, 'unsubscribe'> = async (payload) => {
        return await this.__send({
            type: MESSAGES.UNSUBSCRIBE,
            payload
        });
    }

    pushTransaction: $ElementType<Instance, 'pushTransaction'> = async (payload) => {
        return await this.__send({
            type: MESSAGES.PUSH_TRANSACTION,
            payload
        });
    }

    onMessage: (event: {data: Response}) => void = (event) => {
        if (!event.data) return;
        const { data } = event;

        if (data.type === RESPONSES.NOTIFICATION) {
            this.onNotification(data.payload);
        } else {
            const dfd = this.deferred.find(d => d.id === data.id);
            if (!dfd) {
                console.warn(`Message with id ${data.id} not found`);
                return;
            }
            dfd.resolve(event.data);
            this.deferred = this.deferred.filter(d => d !== dfd);
        }
    }

    onNotification: (notification: any) => void = (notification) => {
        this.emit(notification.type, notification.data);
    }
    
    onError: (error: { message: ?string, lineno: number, filename: string }) => void = (error) => {
        const message = error.message ? `Worker runtime error: Line ${error.lineno} in ${error.filename}: ${error.message}` : 'Worker handshake error';
        const e = new Error(message);
        // reject all pending responses
        this.deferred.forEach(d => {
            d.reject(e);
        });
        this.deferred = [];
    }
}