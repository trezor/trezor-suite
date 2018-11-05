/* @flow */

// WebWorkers manager

/* $FlowIssue loader notation */
import BlockbookWorker from 'worker-loader?name=js/blockbook-worker.[hash].js!./blockbook/index.js';
/* $FlowIssue loader notation */
import RippleWorker from 'worker-loader?name=js/ripple-worker.[hash].js!./ripple/index.js';

import { NETWORKS, RESPONSES } from '../constants';
import type { Response, Deferred } from '../types';
import * as MessageTypes from '../types/messages';
import * as ResponseTypes from '../types/responses';

const instances: Array<Blockchain> = [];

export const getInstance = (network: ?string): Blockchain => {
    if (typeof network !== 'string') throw new Error('Message network not found');
    const instance = instances.find(s => s.network === network);
    if (instance) return instance;

    let newInstance: ?Blockchain;
    console.warn("new INSTANCE!")
    switch (network) {
        case NETWORKS.BLOCKBOOK:
        case NETWORKS.RIPPLE:
            newInstance = new Blockchain(network);
            break;
        default:
            break;
    }

    if(!newInstance)
        throw new Error(`Instance of "${network}" not found`);

    instances.push(newInstance);
    return newInstance;
}

function send<M, R>(instance: Blockchain, message: M): Promise<R> {
    let localResolve: (t: R) => void = () => {};
    let localReject: (e: Error) => void = () => {};

    const promise: Promise<R> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    const dfd: Deferred<R> = {
        id: instance.messageId,
        resolve: localResolve,
        reject: localReject,
        promise,
    }

    instance.deferred.push(dfd);
    instance.worker.postMessage({ id: instance.messageId, ...message });
    instance.messageId++;

    return dfd.promise;
}

// export class Blockchain implements BlockchainInterface {
export class Blockchain {
    messageId: number = 0;
    network: string;
    worker: Worker;
    deferred: Array<Deferred<any>> = [];
    notificationHandler: (event: any) => void;

    constructor(network: string) {
        this.network = network;
        switch (this.network) {
            case NETWORKS.BLOCKBOOK:
                this.worker = new BlockbookWorker();
                break;
            case NETWORKS.RIPPLE:
                this.worker = new RippleWorker();
                break;
        }
        this.worker = new RippleWorker();
        // this.onMessage = this.onMessage.bind(this);
        this.worker.onmessage = this.onMessage;
        this.worker.onerror = this.onError.bind(this);
    }

    async getInfo(message: MessageTypes.GetInfo): Promise<ResponseTypes.GetInfo> {
        return await send(this, message);
    }

    async getAccountInfo(message: MessageTypes.GetAccountInfo): Promise<ResponseTypes.GetAccountInfo> {
        return await send(this, message);
    }

    async subscribe(message: MessageTypes.Subscribe): Promise<ResponseTypes.Subscribe> {
        
        delete message.payload.notificationHandler;
        return await send(this, message);
    }

    async unsubscribe(message: MessageTypes.Subscribe): Promise<ResponseTypes.Subscribe> {
        return await send(this, message);
    }

    async pushTransaction(message: MessageTypes.PushTransaction): Promise<ResponseTypes.PushTransaction> {
        return await send(this, message);
    }

    onMessage = (event: {data: Response}): void => {
        if (!event.data) {
            console.warn('Event data not found in:', event);
            return;
        }

        if (event.data.type == RESPONSES.NOTIFICATION) {
            // if (this.notificationHandler) {
            //     this.notificationHandler(event.data.event);
            // }
        } else {
            const dfd = this.deferred.find(d => d.id === event.data.id);
            if (!dfd) {
                console.warn(`Message promise with id ${event.data.id} not found`);
                return;
            }
            dfd.resolve(event.data);
            this.deferred = this.deferred.filter(d => d !== dfd);
        }
    }

    

    onError = () => {

    }

    // close() {

    // }
}