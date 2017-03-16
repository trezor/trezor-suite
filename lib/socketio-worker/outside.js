/* @flow */

import { Stream, Emitter } from '../utils/stream';

import type {
    InMessage as SocketWorkerInMessage,
    OutMessage as SocketWorkerOutMessage,
} from './inside';
import { deferred } from '../utils/deferred';

type SocketWorkerFactory = () => Worker;

export class Socket {
    endpoint: string;
    socket: SocketWorkerHandler;
    _socketInited: Promise<void>;

    streams: Array<Stream<any>> = [];

    constructor(workerFactory: SocketWorkerFactory, endpoint: string) {
        this.endpoint = endpoint;
        this.socket = new SocketWorkerHandler(workerFactory);
        this._socketInited = this.socket.init(this.endpoint);
    }

    send(message: Object): Promise<any> {
        return this._socketInited.then(() => this.socket.send(message));
    }

    close() {
        this.streams.forEach(stream => stream.dispose());
        this._socketInited.then(() =>
            this.socket.close()
        , () => {});
    }

    observe(event: string): Stream<any> {
        const res = Stream.fromPromise(this._socketInited.then(() => this.socket.observe(event)));
        this.streams.push(res);
        return res;
    }

    subscribe(event: string, ...values: Array<any>) {
        return this._socketInited.then(() => this.socket.subscribe(event, ...values)).catch(() => {});
    }
}

const errortypes = ['connect_error', 'reconnect_error', 'error', 'close', 'disconnect'];

class SocketWorkerHandler {
    _worker: ?Worker;
    workerFactory: () => Worker;
    _emitter: ?Emitter<SocketWorkerOutMessage>;
    counter: number;

    constructor(workerFactory: () => Worker) {
        this.workerFactory = workerFactory;
        this.counter = 0;
    }

    _tryWorker(endpoint: string, type: string): Promise<Worker> {
        const worker = this.workerFactory();
        const dfd = deferred();
        worker.onmessage = (message) => {
            const data = message.data;
            if (typeof data === 'string') {
                const parsed = JSON.parse(data);
                if (parsed.type === 'initDone') {
                    dfd.resolve(worker);
                } else {
                    dfd.reject(new Error('Connection failed.'));
                }
            }
        };

        worker.postMessage(JSON.stringify({
            type: 'init',
            endpoint: endpoint,
            connectionType: type,
        }));
        return dfd.promise;
    }

    init(endpoint: string): Promise<void> {
        return this._tryWorker(endpoint, 'websocket')
            .catch(() => this._tryWorker(endpoint, 'polling'))
            .then((worker) => {
                this._worker = worker;
                const emitter = new Emitter();
                worker.onmessage = (message) => {
                    const data = message.data;
                    if (typeof data === 'string') {
                        emitter.emit(JSON.parse(data));
                    }
                };
                this._emitter = emitter;
                return;
            });
    }

    close() {
        this._sendMessage({
            type: 'close',
        });
    }

    send(message: Object): Promise<any> {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'send',
            message: message,
            id: counter,
        });
        const dfd = deferred();
        if (this._emitter == null) {
            return Promise.reject(new Error('Socket not set.'));
        }
        this._emitter.attach((message, detach) => {
            if (message.type === 'sendReply' && message.id === counter) {
                const {result, error} = message.reply;
                if (error != null) {
                    dfd.reject(error);
                } else {
                    dfd.resolve(result);
                }
                detach();
            }
            if (message.type === 'emit' && errortypes.includes(message.event)) {
                dfd.reject(new Error('Server disconnected.'));
                detach();
            }
        });
        return dfd.promise;
    }

    observe(event: string): Stream<any> {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'observe',
            event: event,
            id: counter,
        });

        if (this._emitter == null) {
            throw new Error('Socket not set.');
        }
        const emitter = this._emitter;

        return Stream.fromEmitter(
            emitter,
            () => {
                this._sendMessage({
                    type: 'unobserve',
                    event: event,
                    id: counter,
                });
            }
        )
        .filter((message) => message.type === 'emit' && message.event === event)
        .map((message) => {
            if (message.data) {
                return message.data;
            }
            return null;
        });
    }

    subscribe(event: string, ...values: Array<any>) {
        this._sendMessage({
            type: 'subscribe',
            event: event,
            values: values,
        });
    }

    _sendMessage(message: SocketWorkerInMessage) {
        if (this._worker == null) {
            throw new Error('Socket not set.');
        }

        this._worker.postMessage(JSON.stringify(message));
    }
}
