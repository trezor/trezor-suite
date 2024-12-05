import WebSocket from 'ws';

import { createDeferred, createDeferredManager, TypedEmitter } from '@trezor/utils';

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

type WsEvents = {
    error: string;
    disconnected: undefined;
};

export type WebsocketRequest = Record<string, any>;
export type WebsocketResponse = WebSocket.Data;

export abstract class WebsocketClient<T extends WebsocketRequest> extends TypedEmitter<
    T & WsEvents
> {
    readonly options: Options;

    public readonly messages;
    private readonly emitter: TypedEmitter<WsEvents> = this;

    private ws?: WebSocket;
    private pingTimeout?: ReturnType<typeof setTimeout>;
    private connectPromise?: Promise<void>;

    protected abstract createWebsocket(): WebSocket;
    protected abstract ping(): Promise<unknown>;

    constructor(options: Options) {
        super();
        this.options = options;
        this.messages = createDeferredManager({
            timeout: this.options.timeout || DEFAULT_TIMEOUT,
            onTimeout: this.onTimeout.bind(this),
        });
    }

    protected initWebsocket(options: Options) {
        // url validation
        let { url } = options;
        if (typeof url !== 'string') {
            throw new Error('websocket_no_url');
        }
        if (url.startsWith('https')) {
            url = url.replace('https', 'wss');
        }
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }

        return new WebSocket(url, options);
    }

    private setPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }

        const onPing = async () => {
            if (this.ws && this.isConnected()) {
                try {
                    await this.onPing();
                } catch {
                    // empty
                }
            }
        };
        this.pingTimeout = setTimeout(onPing, this.options.pingTimeout || DEFAULT_PING_TIMEOUT);
    }

    protected onPing() {
        return this.ping();
    }

    private onTimeout() {
        const { ws } = this;
        if (!ws) return;
        this.messages.rejectAll(new Error('websocket_timeout'));
        ws.close();
    }

    private onError() {
        this.onClose();
    }

    protected sendMessage(message: WebsocketRequest) {
        const { ws } = this;
        if (!ws) throw new Error('websocket_not_initialized');
        const { promiseId, promise } = this.messages.create();

        const req = { id: promiseId.toString(), ...message };

        this.setPingTimeout();

        this.options.onSending?.(message);

        ws.send(JSON.stringify(req));

        return promise;
    }

    protected onMessage(message: WebsocketResponse) {
        try {
            const resp = JSON.parse(message.toString());
            const { id, data } = resp;
            if (data.error) {
                this.messages.reject(Number(id), new Error(data.error.message));
            } else {
                this.messages.resolve(Number(id), data);
            }
        } catch {
            // empty
        }

        this.setPingTimeout();
    }

    async connect() {
        // if connecting already, just return the promise
        if (this.connectPromise) {
            return this.connectPromise;
        }

        if (this.isConnected()) return Promise.resolve();

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
                ws.emit('error', new Error('websocket_timeout'));
                try {
                    ws.once('error', () => {}); // hack; ws throws uncaughtably when there's no error listener
                    ws.close();
                } catch {
                    // empty
                }
            },
            this.options.connectionTimeout || this.options.timeout || DEFAULT_TIMEOUT,
        );

        ws.once('error', error => {
            clearTimeout(connectionTimeout);
            this.onClose();
            dfd.reject(new Error(error.message));
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
        });
    }

    disconnect() {
        this.emitter.emit('disconnected');
        this.ws?.close();
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private onClose() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }

        this.disconnect();

        this.ws?.removeAllListeners();
        this.messages.rejectAll(new Error('Websocket closed unexpectedly'));
    }

    dispose() {
        this.removeAllListeners();
        this.onClose();
    }
}
