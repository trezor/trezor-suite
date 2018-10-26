/* @flow */

// WebWorkers manager

/* $FlowIssue loader notation */
import RippleWorker from 'worker-loader?name=js/ripple-worker.[hash].js!./ripple/index.js';
import { create as createDeferred } from '../utils/deffered';

import { MESSAGES, RESPONSES } from '../constants';
import type { Message, Response, Deferred } from '../types';

const sockets: Array<Socket> = [];

export const send = async (message: Message) => {
    if (!message.type) throw new Error('Message type not found');
    if (!message.network) throw new Error('Message network not found');

    let socket = sockets.find(s => s.network === message.network);
    if (!socket) {
        socket = new Socket(message.network);
        await socket.init();
        sockets.push(socket);
    }
    return await socket.send(message);
}

class Socket {
    messageId: number = 0;
    network: string;
    worker: Worker;
    deferred: Array<Deferred<any>> = [];
    notificationHandler: (event: any) => void = null;

    constructor(network: string) {
        this.network = network;
        this.worker = new RippleWorker();
        this.worker.onmessage = this.onMessage.bind(this);
        this.worker.onerror = this.onError.bind(this);
    }

    async init() {
        return await this.send({ type: MESSAGES.INIT });
    }

    async send(message: Message) {
        if (message.type === MESSAGES.SUBSCRIBE && message.notificationHandler) {
            this.notificationHandler = message.notificationHandler;
            // handler must not be passed to the worker
            message.notificationHandler = undefined;
        }
        const dfd = createDeferred(this.messageId);
        this.deferred.push(dfd);
        this.worker.postMessage({ id: this.messageId, ...message });
        this.messageId++;
        return await dfd.promise;
    }

    onMessage(event: { data: Response }) {
        if (!event.data) return;
        if (event.data.type == RESPONSES.NOTIFICATION) {
            if (this.notificationHandler) {
                this.notificationHandler(event.data.event);
            }
        } else {
            const dfd = this.deferred.find(d => d.id === event.data.id);
            if (!dfd) return;
            dfd.resolve(event.data);
        }
    }

    onError() {

    }

    close() {

    }
}