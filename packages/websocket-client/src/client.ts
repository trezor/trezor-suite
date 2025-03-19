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
    onSending?: (message: Record<string, any>) => void;
};

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

type WebsocketClientEvents = {
    error: string;
    disconnected: undefined;
};

export type WebsocketRequest = Record<string, any>;
export type WebsocketResponse = WebSocket.Data;

export abstract class WebsocketClient<Events extends Record<string, any>> extends TypedEmitter<
    Events & WebsocketClientEvents
> {
    readonly options: Options;

    public readonly messages;
    private readonly emitter: TypedEmitter<WebsocketClientEvents> = this;

    private ws?: WebSocket;
    private pingTimeout?: ReturnType<typeof setTimeout>;
    private connectPromise?: Promise<void>;

    protected createWebsocket?(): WebSocket;
    protected abstract ping(): Promise<unknown>;

    constructor(options: Options) {
        super();
        this.options = options;
        this.messages = createDeferredManager({
            timeout: this.options.timeout || DEFAULT_TIMEOUT,
            onTimeout: this.onTimeout.bind(this),
        });
    }

    protected initWebsocket({ url, timeout, headers, agent }: WebsocketOptions) {
        // url validation
        if (typeof url !== 'string') {
            throw new Error('websocket_no_url');
        }
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }

        return new WebSocket(url, { timeout, headers, agent });
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
        if (!ws || !this.isConnected()) throw new Error('websocket_not_initialized');
        const { promiseId, promise } = this.messages.create();

        const req = { id: promiseId.toString(), ...message };

        this.setPingTimeout();

        this.options.onSending?.(message);

        ws.send(JSON.stringify(req));

        return promise;
    }

    protected sendRawMessage(message: WebSocket.Data) {
        const { ws } = this;
        if (!ws || !this.isConnected()) throw new Error('websocket_not_initialized');

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
        this.messages.rejectAll(new Error('Websocket closed unexpectedly'));
    }

    dispose() {
        this.removeAllListeners();
        this.disconnect();
        this.onClose();
    }
}
