/* eslint-disable no-console */

import fetch from 'cross-fetch';

import {
    WebsocketClient as WebsocketClientBase,
    WebsocketResponse as WebsocketResponseData,
} from '@trezor/websocket-client';

import { Firmwares } from './types';

// Making the timeout high because the controller in trezor-user-env
// must synchronously run actions on emulator and they may take a long time
// (for example in case of Shamir backup)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

// breaking change in node 17, ip6 is preferred by default
// localhost is not resolved correctly on certain machines
const USER_ENV_URL = {
    WEBSOCKET: `ws://127.0.0.1:9001/`,
    DASHBOARD: `http://127.0.0.1:9002`,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type WebsocketClientEvents = {
    firmwares: Firmwares;
    disconnected: undefined;
};

interface WebsocketRequest {
    type: string;
}

interface WebsocketResponse {
    response: any;
}

export class WebsocketClient extends WebsocketClientBase<WebsocketClientEvents> {
    protected createWebsocket() {
        return this.initWebsocket(this.options);
    }

    protected ping() {
        return this.send({ type: 'ping' });
    }

    constructor(options: any = {}) {
        super({
            ...options,
            url: options.url || USER_ENV_URL.WEBSOCKET,
            timeout: options.timeout || DEFAULT_TIMEOUT,
            pingTimeout: options.pingTimeout || DEFAULT_PING_TIMEOUT,
        });
    }

    async send<T extends WebsocketRequest>(params: T): Promise<WebsocketResponse> {
        // probably after update to node 18 it started to disconnect after certain
        // period of inactivity.
        await this.connect();

        return this.sendMessage(params);
    }

    async connect() {
        if (this.isConnected()) return Promise.resolve();

        // workaround for karma... proper fix: set allow origin headers in trezor-user-env server. but we are going
        // to get rid of karma anyway, so this does not matter
        if (typeof window === 'undefined') {
            await this.waitForTrezorUserEnv();
        }

        return new Promise<void>(resolve => {
            super.connect().then(() => {
                this.once('firmwares', () => resolve());
            });
        });
    }

    disconnect() {
        // TODO: breaking change
        // previous implementation `disconnect` acts like `dispose`. does not emit 'disconnected' event
        if (this.isConnected()) {
            this.removeAllListeners();

            return super.disconnect();
        }

        return Promise.resolve();
    }

    protected onMessage(message: WebsocketResponseData) {
        super.onMessage(message, resp => {
            if (resp.type === 'client') {
                this.emit('firmwares', resp.firmwares);
            } else {
                if (!resp.success) {
                    const err = resp.error.message || resp.error;

                    // this is sort of expected, we don't want this to kill entire test run.
                    if (err.includes('ReadTimeout')) {
                        console.log('=== ERROR === websocket_error_message: ReadTimeout');
                    } else {
                        throw new Error(`websocket_error_message: ${err}`);
                    }
                }
            }

            return resp;
        });
    }

    async waitForTrezorUserEnv() {
        // unfortunately, it can take incredibly long for trezor-user-env to start, we should
        // do something about it
        const limit = 300;
        let error = '';

        console.log('waiting for trezor-user-env');

        for (let i = 0; i < limit; i++) {
            if (i === limit - 1) {
                console.log(`cant connect to trezor-user-env: ${error}\n`);
            }
            await delay(1000);

            try {
                const res = await fetch(USER_ENV_URL.DASHBOARD);
                if (res.status === 200) {
                    console.log('trezor-user-env is online');

                    return;
                }
            } catch (err) {
                error = err.message;
                // using process.stdout.write instead of console.log since the latter always prints also newline
                // but in karma, this code runs in browser and process is not available.
                if (typeof process !== 'undefined') {
                    process.stdout.write('.');
                } else {
                    console.log('.');
                }
            }
        }

        throw error;
    }
}
