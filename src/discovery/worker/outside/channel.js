/* @flow */

import queue from 'queue';
import type {
    InMessage,
    OutMessage,
    PromiseRequestOutMessage,
    PromiseResponseType,
    PromiseRequestType,
    StreamRequestOutMessage,
    StreamRequestType,
} from '../types';

import { Emitter, Stream } from '../../../utils/stream';
import type { AccountInfo } from '../../index';

// eslint-disable-next-line no-undef
type WorkerFactory = () => Worker;

// will get injected
type GetPromise = (p: PromiseRequestType) => Promise<any>;
type GetStream = (p: StreamRequestType) => Stream<any>;

const CONCURRENT_WORKERS = 4;
const q = queue({ concurrency: CONCURRENT_WORKERS, autostart: true });

export class WorkerChannel {
    // eslint-disable-next-line no-undef
    w: Promise<{worker: Worker, finish: () => void}>;

    messageEmitter: Emitter<OutMessage> = new Emitter();

    getPromise: GetPromise;

    getStream: GetStream;

    constructor(
        f: WorkerFactory,
        getPromise: GetPromise,
        getStream: GetStream,
    ) {
        this.getPromise = getPromise;
        this.getStream = getStream;

        this.w = new Promise((resolve) => {
            q.push((cb) => {
                const worker = f();
                const finish = cb;

                // $FlowIssue
                worker.onmessage = (event: {data: OutMessage}) => {
                    // eslint-disable-next-line
                    const data: OutMessage = event.data;
                    this.messageEmitter.emit(data);
                };

                resolve({ worker, finish });
            });
        });

        this.messageEmitter.attach((message) => {
            if (message.type === 'promiseRequest') {
                this.handlePromiseRequest(message);
            }
            if (message.type === 'streamRequest') {
                this.handleStreamRequest(message);
            }
        });
    }

    postToWorker(m: InMessage) {
        this.w.then((w) => {
            w.worker.postMessage(m);
        });
    }

    resPromise(onFinish: () => void): Promise<AccountInfo> {
        return new Promise((resolve, reject) => {
            this.messageEmitter.attach((message, detach) => {
                if (message.type === 'result') {
                    resolve(message.result);
                    detach();
                    onFinish();
                    this.w.then((w) => {
                        w.worker.terminate();
                        w.finish();
                    });
                }
                if (message.type === 'error') {
                    reject(new Error(message.error));
                    detach();
                    onFinish();
                    this.w.then((w) => {
                        w.worker.terminate();
                        w.finish();
                    });
                }
            });
        });
    }

    handlePromiseRequest(request: PromiseRequestOutMessage) {
        const promise = this.getPromise(request.request);

        promise.then((result) => {
            // $FlowIssue I overload Flow logic a bit here
            const r: PromiseResponseType = {
                type: request.request.type,
                response: result,
            };
            this.postToWorker({
                type: 'promiseResponseSuccess',
                id: request.id,
                response: r,
            });
        }, (error) => {
            const message = error.message == null ? error.toString() : error.message.toString();
            this.postToWorker({
                type: 'promiseResponseFailure',
                failure: message,
                id: request.id,
            });
        });
    }

    handleStreamRequest(request: StreamRequestOutMessage) {
        const stream = this.getStream(request.request);

        stream.values.attach((value) => {
            this.postToWorker({
                type: 'streamResponseUpdate',
                id: request.id,
                update: {
                    type: request.request.type,
                    response: value,
                },
            });
        });
        stream.finish.attach(() => {
            this.postToWorker({
                type: 'streamResponseFinish',
                id: request.id,
            });
        });
    }
}
