import WebSocket from 'ws';
import { createDeferred } from '@trezor/utils';
import { createDeferredManager } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils';

import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';

interface Subscription<T> {
    id: string;
    type: T;
    callback: (result: any) => void;
}

interface Options {
    url: string;
    timeout?: number;
    pingTimeout?: number;
    connectionTimeout?: number;
    keepAlive?: boolean;
    agent?: WebSocket.ClientOptions['agent'];
    headers?: WebSocket.ClientOptions['headers'];
    onSending?: (message: Record<string, any>) => void;
}

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

type EventMap = { [event: string]: any };

type WsEvents = {
    error: string;
    disconnected: undefined;
};

export abstract class BaseWebsocket<T extends EventMap> extends TypedEmitter<T & WsEvents> {
    readonly options: Options;

    private readonly messages;
    private readonly subscriptions: Subscription<keyof T>[] = [];
    private readonly emitter: TypedEmitter<WsEvents> = this;

    private ws?: WebSocket;
    private pingTimeout?: ReturnType<typeof setTimeout>;
    private connectPromise?: Promise<void>;

    protected abstract ping(): Promise<unknown>;
    protected abstract createWebsocket(): WebSocket;

    constructor(options: Options) {
        super();
        this.options = options;
        this.messages = createDeferredManager({
            timeout: this.options.timeout || DEFAULT_TIMEOUT,
            onTimeout: this.onTimeout.bind(this),
        });
    }

    private setPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(
            this.onPing.bind(this),
            this.options.pingTimeout || DEFAULT_PING_TIMEOUT,
        );
    }

    private onTimeout() {
        const { ws } = this;
        if (!ws) return;
        this.messages.rejectAll(new CustomError('websocket_timeout'));
        ws.close();
    }

    private async onPing() {
        // make sure that connection is alive if there are subscriptions
        if (this.ws && this.isConnected()) {
            try {
                if (this.subscriptions.length > 0 || this.options.keepAlive) {
                    await this.ping();
                } else {
                    this.ws.close();
                }
            } catch (error) {
                // empty
            }
        }
    }

    private onError() {
        this.onClose();
    }

    protected sendMessage(message: Record<string, any>) {
        const { ws } = this;
        if (!ws) throw new CustomError('websocket_not_initialized');
        const { promiseId, promise } = this.messages.create();

        const req = { id: promiseId.toString(), ...message };

        this.setPingTimeout();

        this.options.onSending?.(message);

        ws.send(JSON.stringify(req));
        return promise;
    }

    protected onMessage(message: string) {
        try {
            const resp = JSON.parse(message);
            const { id, data } = resp;

            const messageSettled = data.error
                ? this.messages.reject(
                      Number(id),
                      new CustomError('websocket_error_message', data.error.message),
                  )
                : this.messages.resolve(Number(id), data);

            if (!messageSettled) {
                const subs = this.subscriptions.find(s => s.id === id);
                if (subs) {
                    subs.callback(data);
                }
            }
        } catch (error) {
            // empty
        }

        this.setPingTimeout();
    }

    protected addSubscription<E extends keyof T>(type: E, callback: (result: T[E]) => void) {
        const id = this.messages.nextId().toString();
        this.subscriptions.push({ id, type, callback });
    }

    protected removeSubscription(type: keyof T) {
        const index = this.subscriptions.findIndex(s => s.type === type);
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
        }
        return index;
    }

    async connect() {
        // if connecting already, just return the promise
        if (this.connectPromise) {
            return this.connectPromise;
        }

        if (this.ws?.readyState === WebSocket.CLOSING) {
            await new Promise<void>(resolve => this.emitter.once('disconnected', resolve));
        }

        // create deferred promise
        const dfd = createDeferred(-1);
        this.connectPromise = dfd.promise;

        const ws = this.createWebsocket();

        // set connection timeout before WebSocket initialization
        const connectionTimeout = setTimeout(
            () => {
                ws.emit('error', new CustomError('websocket_timeout'));
                try {
                    ws.once('error', () => {}); // hack; ws throws uncaughtably when there's no error listener
                    ws.close();
                } catch (error) {
                    // empty
                }
            },
            this.options.connectionTimeout || this.options.timeout || DEFAULT_TIMEOUT,
        );

        ws.once('error', error => {
            clearTimeout(connectionTimeout);
            this.onClose();
            dfd.reject(new CustomError('websocket_runtime_error', error.message));
        });
        ws.on('open', () => {
            clearTimeout(connectionTimeout);
            this.init();
            dfd.resolve();
        });

        this.ws = ws;

        // wait for onopen event
        return dfd.promise.finally(() => {
            this.connectPromise = undefined;
        });
    }

    private init() {
        const { ws } = this;
        if (!ws || !this.isConnected()) {
            throw Error('Websocket init cannot be called');
        }

        // remove previous listeners and add new listeners
        ws.removeAllListeners();
        ws.on('error', this.onError.bind(this));
        ws.on('message', this.onMessage.bind(this));
        ws.on('close', () => {
            this.onClose();
            this.emitter.emit('disconnected');
        });
    }

    disconnect() {
        this.ws?.close();
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private onClose() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }

        if (this.isConnected()) {
            this.disconnect();
        }
        this.ws?.removeAllListeners();
        this.messages.rejectAll(
            new CustomError('websocket_runtime_error', 'Websocket closed unexpectedly'),
        );
    }

    dispose() {
        this.onClose();
        this.removeAllListeners();
    }
}
