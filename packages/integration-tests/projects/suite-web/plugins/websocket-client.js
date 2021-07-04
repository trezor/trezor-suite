/* eslint-disable @typescript-eslint/no-var-requires */
const WebSocket = require('ws');
const { EventEmitter } = require('events');

const NOT_INITIALIZED = new Error('websocket_not_initialized');

const createDeferred = id => {
    let localResolve = t => () => { };
    let localReject = e => () => { };

    const promise = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
};

// Making the timeout high because the controller in trezor-user-env
// must synchronously run actions on emulator and they may take a long time
// (for example in case of Shamir backup)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

class Controller extends EventEmitter {
    constructor(options) {
        super();
        this.messageID = 0;
        this.messages = [];
        this.subscriptions = [];
        // this.setMaxListeners(Infinity);
        this.options = {
            pingTimeout: DEFAULT_PING_TIMEOUT,
            timeout: DEFAULT_TIMEOUT,
            ...options
        };
    }

    setConnectionTimeout() {
        this.clearConnectionTimeout();
        this.connectionTimeout = setTimeout(
            this.onTimeout.bind(this),
            this.options.timeout,
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
            this.options.pingTimeout,
        );
    }

    onTimeout() {
        console.log('[ws]: onTimeout')
        const { ws } = this;
        if (!ws) return;
        if (ws.listenerCount('open') > 0) {
            ws.emit('error', 'Websocket timeout');
            try {
                ws.close();
            } catch (error) {
                console.log('[ws]: onTimeout close err', err.message);
                // empty
            }
        } else {
            this.messages.forEach(m => m.reject(new Error('websocket_timeout')));
            ws.close();
        }
    }

    async onPing() {
        console.log('[ws]: onPing')

        // make sure that connection is alive if there are subscriptions
        if (this.ws && this.isConnected()) {
            if (this.subscriptions.length > 0 || this.options.keepAlive) {
                console.log('[ws]: getBlockHash. This cant work!')
                await this.getBlockHash(0);
            } else {
                try {
                    this.ws.close();
                } catch (error) {
                    console.log('[ws]: onPing close error', err.message)
                    // empty
                }
            }
        }
    }

    onError() {
        this.dispose();
    }

    send(params) {
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
        console.log('[ws]: sending', req);
        ws.send(JSON.stringify(req));

        return dfd.promise;
    }

    onmessage(message) {
        console.log('[ws]: onmessage', message);
        try {
            const resp = JSON.parse(message);
            const { id, success } = resp;
            const dfd = this.messages.find(m => m.id === id);
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
            // this can indeed happen
            console.log('[ws]: error', error.message)
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

        // create deferred promise
        const dfd = createDeferred(-1);

        // initialize connection
        const ws = new WebSocket(url);

        ws.once('error', error => {
            console.log('[ws]: ws once error', error.message);

            this.dispose();
            dfd.reject(new Error('websocket_runtime_error: ', error.message));
        });

        ws.on('open', () => {
            this.init();
            dfd.resolve();
        });

        this.ws = ws;

        // wait for onopen event
        return dfd.promise;
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
            console.log('[ws]: close');
            this.emit('disconnected');
            this.dispose();
        });
        ws.on('ping', () => {
            console.log('[ws]: ping');
        })
        ws.on('pong', () => {
            console.log('[ws]: pong');
        })
        ws.on('unexpected-response', () => {
            console.log('[ws]: unexpected-response');
        })
        ws.on('upgrade', () => {
            console.log('[ws]: upgrade');
        })
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.dispose();
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

module.exports = {
    Controller,
};
