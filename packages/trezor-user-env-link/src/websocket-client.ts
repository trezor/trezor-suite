import WebSocket from 'ws';
import { EventEmitter } from 'events';

import { createDeferred, Deferred } from '@trezor/utils';

const NOT_INITIALIZED = new Error('websocket_not_initialized');

// Making the timeout high because the controller in trezor-user-env
// must synchronously run actions on emulator and they may take a long time
// (for example in case of Shamir backup)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

interface Options {
    pingTimeout?: number;
    url?: string;
    timeout?: number;
}

export class TrezorUserEnvLink extends EventEmitter {
    messageID: number;
    options: Options;
    messages: Deferred<any>[];

    ws?: WebSocket;
    connectionTimeout?: NodeJS.Timeout;
    pingTimeout?: NodeJS.Timeout;

    constructor(options: Options = {}) {
        super();
        this.messageID = 0;
        this.messages = [];
        this.setMaxListeners(Infinity);
        this.options = {
            ...options,
            url: options.url || 'ws://localhost:9001/',
        };
    }

    setConnectionTimeout() {
        this.clearConnectionTimeout();
        this.connectionTimeout = setTimeout(
            this.onTimeout.bind(this),
            this.options.timeout || DEFAULT_TIMEOUT,
        );
    }

    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = undefined;
        }
    }

    setPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(
            this.onPing.bind(this),
            this.options.pingTimeout || DEFAULT_PING_TIMEOUT,
        );
    }

    onTimeout() {
        const { ws } = this;
        if (!ws) return;
        if (ws.listenerCount('open') > 0) {
            ws.emit('error', 'Websocket timeout');
            try {
                ws.close();
            } catch (error) {
                // empty
            }
        } else {
            this.messages.forEach(m => m.reject(new Error('websocket_timeout')));
            ws.close();
        }
    }

    onPing() {
        // make sure that connection is alive if there are subscriptions
        if (this.ws && this.isConnected()) {
            try {
                this.ws.close();
            } catch (error) {
                // empty
            }
        }
    }

    onError() {
        this.dispose();
    }

    // todo: typesafe interface
    send(params: any) {
        const { ws } = this;
        if (!ws) throw NOT_INITIALIZED;
        const id = this.messageID;

        const dfd = createDeferred(id);
        const req = {
            id,
            ...params,
        };

        this.messageID++;
        this.messages.push(dfd);

        this.setConnectionTimeout();
        this.setPingTimeout();

        ws.send(JSON.stringify(req));
        // todo: proper return type
        return dfd.promise as Promise<{ response: any }>;
    }

    // todo: typesafe messages
    onmessage(message: any) {
        try {
            const resp = JSON.parse(message);
            const { id, success } = resp;
            const dfd = this.messages.find(m => m.id === id);

            if (resp.type === 'client') {
                const { firmwares } = resp;
                if (!firmwares['1'] || !firmwares['2'] || !firmwares.R) {
                    throw new Error('unexpected response in firmwares event');
                }

                this.emit('firmwares', firmwares);
            }

            if (dfd) {
                if (!success) {
                    dfd.reject(
                        new Error(`websocket_error_message: ${resp.error.message || resp.error}`),
                    );
                } else {
                    dfd.resolve(resp);
                }
                this.messages.splice(this.messages.indexOf(dfd), 1);
            }
        } catch (error) {
            // empty
        }

        if (this.messages.length === 0) {
            this.clearConnectionTimeout();
        }
        this.setPingTimeout();
    }

    connect() {
        if (this.isConnected()) return Promise.resolve();
        // url validation
        let { url } = this.options;
        if (typeof url !== 'string') {
            throw new Error('websocket_no_url');
        }

        if (url.startsWith('https')) {
            url = url.replace('https', 'wss');
        }
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }

        // set connection timeout before WebSocket initialization
        // it will be be cancelled by this.init or this.dispose after the error
        this.setConnectionTimeout();

        const firmwaresEventPromise = createDeferred();

        // initialize connection
        const ws = new WebSocket(url);
        ws.once('error', error => {
            this.dispose();
            // @ts-expect-error todo:
            firmwaresEventPromise.reject(new Error('websocket_runtime_error: ', error.message));
        });
        ws.on('open', () => {
            this.init();
        });
        this.on('firmwares', firmwares => {
            firmwaresEventPromise.resolve(firmwares);
        });

        this.ws = ws;

        // wait for onopen event
        return firmwaresEventPromise.promise;
    }

    init() {
        const { ws } = this;
        if (!ws || !this.isConnected()) {
            throw Error('Websocket init cannot be called');
        }
        // clear timeout from this.connect
        this.clearConnectionTimeout();

        // remove previous listeners and add new listeners
        ws.removeAllListeners();
        ws.on('error', this.onError.bind(this));
        ws.on('message', this.onmessage.bind(this));
        ws.on('close', () => {
            this.emit('disconnected');
            this.dispose();
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        // this.dispose();
    }

    isConnected() {
        const { ws } = this;
        return ws && ws.readyState === WebSocket.OPEN;
    }

    dispose() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        const { ws } = this;
        if (this.isConnected()) {
            this.disconnect();
        }
        if (ws) {
            ws.removeAllListeners();
        }

        this.removeAllListeners();
    }
}

// todo: alias for compatibility. remove later
export const Controller = TrezorUserEnvLink;
