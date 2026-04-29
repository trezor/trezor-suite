import WebSocket from 'ws';

import { TypedEmitter, createDeferred, createDeferredManager } from '@trezor/utils';

type WebsocketOptions = {
    url: string;
    timeout?: number;
    agent?: WebSocket.ClientOptions['agent'];
    headers?: WebSocket.ClientOptions['headers'];
};

type Options = WebsocketOptions & {
    pingTimeout?: number;
    connectionTimeout?: number;
    keepAlive?: boolean;
    concurrency?: number;
    onSending?: (message: Record<string, any>) => void;
};

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

type WebsocketClientEvents = {
    error: string;
    disconnected: undefined;
};

export type WebsocketSendParams = { timeout?: number; onIdCreated?: (id: number) => void };

export type WebsocketRequest = Record<string, any>;
export type WebsocketResponse = WebSocket.Data;

export class WebsocketError extends Error {}

export class WebsocketClient<Events extends Record<string, any>> extends TypedEmitter<
    Events & WebsocketClientEvents
> {
    readonly options: Options;

    protected readonly messages;
    private readonly emitter: TypedEmitter<WebsocketClientEvents> = this;

    private ws?: WebSocket;
    private pingTimeout?: ReturnType<typeof setTimeout>;
    private connectPromise?: Promise<void>;

    protected createWebsocket?(): WebSocket;
    protected ping() {
        return this.sendMessage({ type: 'ping' });
    }

    constructor(options: Options) {
        super();
        this.options = options;
        this.messages = createDeferredManager({
            timeout: this.options.timeout || DEFAULT_TIMEOUT,
            onTimeout: promiseId => this.onMessageTimeout(promiseId),
        });
    }

    protected initWebsocket({ url, timeout, headers, agent }: WebsocketOptions) {
        // url validation
        if (typeof url !== 'string') {
            throw new WebsocketError('websocket_no_url');
        }
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }

        return new WebSocket(url, {
            timeout,
            headers: {
                // for convenience auto spoof Origin header in node.js
                Origin: 'https://node.trezor.io',
                ...headers,
            },
            agent,
        });
    }

    private setPingTimeout() {
        clearTimeout(this.pingTimeout);

        const doPing = () => {
            if (this.isConnected()) {
                return this.onPing().catch(() => {});
            }
        };

        this.pingTimeout = this.isConnected()
            ? setTimeout(doPing, this.options.pingTimeout || DEFAULT_PING_TIMEOUT)
            : undefined;
    }

    protected onPing() {
        return this.ping();
    }

    onMessageTimeout(_promiseId: number) {
        const { ws } = this;
        if (!ws) return;
        this.messages.rejectAll(new WebsocketError('websocket_timeout'));
        ws.close();
    }

    private onError() {
        this.onClose();
    }

    async sendMessage(
        message: WebsocketRequest,
        { timeout, onIdCreated }: WebsocketSendParams = {},
    ) {
        const { ws } = this;
        if (!ws || !this.isConnected()) throw new WebsocketError('websocket_not_initialized');

        let promise;
        if (this.options.concurrency) {
            promise = await this.messages.createConcurrent(this.options.concurrency, timeout);

            if (!ws || !this.isConnected()) {
                this.messages.resolve(promise.promiseId, undefined);
                throw new WebsocketError('websocket_not_initialized');
            }
        } else {
            promise = this.messages.create(timeout);
        }

        onIdCreated?.(promise.promiseId);

        const req = { id: promise.promiseId.toString(), ...message };

        this.setPingTimeout();

        this.options.onSending?.(message);

        ws.send(JSON.stringify(req));

        return promise.promise;
    }

    protected sendRawMessage(message: WebSocket.Data) {
        const { ws } = this;
        if (!ws || !this.isConnected()) throw new WebsocketError('websocket_not_initialized');

        ws.send(message, {
            binary: typeof message !== 'string',
        });

        this.setPingTimeout();
    }

    // TODO: data type generic
    // `messageValidation` - additionally validates `data` in the subclass
    //  returns `payload` or throws error to automatically resolve/reject pending message
    //  returns `undefined` to resolve pending message manually in the subclass
    protected onMessage(
        message: WebsocketResponse,
        messageValidation?: (data: Record<string, any>) => Record<string, any> | void,
    ) {
        try {
            const data = JSON.parse(message.toString());
            const messageId = Number(data.id);
            try {
                const payload = messageValidation ? messageValidation(data) : data;
                if (payload) {
                    this.messages.resolve(messageId, payload);
                }
            } catch (error) {
                this.messages.reject(messageId, error);
            }
        } catch {
            // empty
        } finally {
            this.setPingTimeout();
        }
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
        const dfd = createDeferred();
        this.connectPromise = dfd.promise;

        const ws = this.createWebsocket ? this.createWebsocket() : this.initWebsocket(this.options);

        // set connection timeout before WebSocket initialization
        const connectionTimeout = setTimeout(
            () => {
                this.onClose();
                dfd.reject(new WebsocketError('websocket_timeout'));
                try {
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
            dfd.reject(new WebsocketError(error.message));
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
        ws.on('error', _error => this.onError());
        ws.on('message', message => this.onMessage(message));
        ws.on('close', () => {
            this.emitter.emit('disconnected');
            this.onClose();
        });
    }

    disconnect() {
        if (this.isConnected()) {
            const disconnectPromise = new Promise<void>(resolve => {
                this.ws?.once('close', resolve);
            });
            this.ws?.close();

            return disconnectPromise;
        }

        return Promise.resolve();
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private onClose() {
        clearTimeout(this.pingTimeout);

        this.ws?.removeAllListeners();
        this.ws?.on('error', () => {
            // Suppress errors after close
        });
        this.messages.rejectAll(new WebsocketError('Websocket closed unexpectedly'));
    }

    dispose() {
        this.removeAllListeners();
        this.disconnect();
        this.onClose();
    }
}
