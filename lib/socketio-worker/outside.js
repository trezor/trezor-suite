/* @flow */

import { Stream, Emitter } from '../utils/stream';

import type {
    InMessage as SocketWorkerInMessage,
    OutMessage as SocketWorkerOutMessage,
} from './inside';
import { deferred } from '../utils/deferred';

type SocketWorkerFactory = () => Worker;

let logCommunication = false;
export function setLogCommunication() {
    logCommunication = true;
}

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

const errorTypes = ['connect_error', 'reconnect_error', 'error', 'close', 'disconnect'];
const disconnectErrorTypes = ['connect_error', 'reconnect_error', 'close', 'disconnect'];

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

                disconnectErrorTypes.forEach(type => {
                    this.observe(type).map(() => {
                        // almost the same as this.close(),
                        // but doesn't call destroy()
                        // since that would also delete all handlers attached on emitters
                        // and we want to observe errors from more places
                        this._sendMessage({
                            type: 'close',
                        });
                        this._emitter = null;
                    });
                });

                return;
            });
    }

    close() {
        this._sendMessage({
            type: 'close',
        });
        if (this._emitter != null) {
            this._emitter.destroy();
            this._emitter = null;
        }
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
            return Promise.reject(new Error('Server disconnected.'));
        }
        this._emitter.attach((message, detach) => {
            if (logCommunication) {
                console.log('[socket.io] in message', message);
            }

            if (message.type === 'sendReply' && message.id === counter) {
                const {result, error} = message.reply;
                if (error != null) {
                    dfd.reject(error);
                } else {
                    dfd.resolve(result);
                }
                detach();
            }
            // This is not covered by coverage, because it's hard to simulate
            // Happens when the server is disconnected during some long operation
            // It's hard to simulate long operation on regtest (very big transactions)
            // but happens in real life
            if (message.type === 'emit' && (errorTypes.indexOf(message.event) !== -1)) {
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

        // $FlowIssue - this can't be null if used from bitcore.js
        const emitter: Emitter<SocketWorkerOutMessage> = this._emitter;

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
            // $FlowIssue it always have data because of the filtering
            return message.data;
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
        // $FlowIssue - this can't be null if used from bitcore.js
        const worker: Worker = this._worker;
        if (logCommunication) {
            console.log('[socket.io] out message', message);
        }

        worker.postMessage(JSON.stringify(message));
    }
}
