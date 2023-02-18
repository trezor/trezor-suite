import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { createDeferred, Deferred } from '@trezor/utils/lib/createDeferred';

import { CustomError } from '../../constants/errors';
import type {
    BlockNotification,
    MempoolTransactionNotification,
    AddressNotification,
    Send,
    FiatRatesNotification,
} from '../../types/blockbook';
import type {
    GetFiatRatesForTimestamps,
    GetFiatRatesTickersList,
    GetCurrentFiatRates,
} from '../../types/messages';
import type {
    AccountInfoParams,
    EstimateFeeParams,
    AccountBalanceHistoryParams,
} from '../../types/params';

const NOT_INITIALIZED = new CustomError('websocket_not_initialized');

interface Subscription {
    id: string;
    type: 'notification' | 'block' | 'mempool' | 'fiatRates';
    callback: (result: any) => void;
}

interface Options {
    url: string;
    timeout?: number;
    pingTimeout?: number;
    keepAlive?: boolean;
    agent?: WebSocket.ClientOptions['agent'];
}

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;

export declare interface BlockbookAPI {
    on(event: 'block', listener: (event: BlockNotification) => void): this;
    on(event: 'mempool', listener: (event: MempoolTransactionNotification) => void): this;
    on(event: 'notification', listener: (event: AddressNotification) => void): this;
    on(event: 'fiatRates', listener: (event: FiatRatesNotification) => void): this;
    on(event: 'error', listener: (error: string) => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: string, listener: any): this;
}

export class BlockbookAPI extends EventEmitter {
    options: Options;
    ws: WebSocket | undefined;
    messageID = 0;
    messages: Deferred<any>[] = [];
    subscriptions: Subscription[] = [];
    pingTimeout: ReturnType<typeof setTimeout> | undefined;
    connectionTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(options: Options) {
        super();
        this.setMaxListeners(Infinity);
        this.options = options;
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
            this.messages.forEach(m => m.reject(new CustomError('websocket_timeout')));
            ws.close();
        }
    }

    async onPing() {
        // make sure that connection is alive if there are subscriptions
        if (this.ws && this.isConnected()) {
            if (this.subscriptions.length > 0 || this.options.keepAlive) {
                await this.getBlockHash(0);
            } else {
                try {
                    this.ws.close();
                } catch (error) {
                    // empty
                }
            }
        }
    }

    onError() {
        this.dispose();
    }

    send: Send = (method, params = {}) => {
        const { ws } = this;
        if (!ws) throw NOT_INITIALIZED;
        const id = this.messageID.toString();

        const dfd = createDeferred(id);
        const req = {
            id,
            method,
            params,
        };

        this.messageID++;
        this.messages.push(dfd);

        this.setConnectionTimeout();
        this.setPingTimeout();

        ws.send(JSON.stringify(req));
        return dfd.promise as Promise<any>;
    };

    onmessage(message: string) {
        try {
            const resp = JSON.parse(message);
            const { id, data } = resp;
            const dfd = this.messages.find(m => m.id === id);
            if (dfd) {
                if (data.error) {
                    dfd.reject(new CustomError('websocket_error_message', data.error.message));
                } else {
                    dfd.resolve(data);
                }
                this.messages.splice(this.messages.indexOf(dfd), 1);
            } else {
                const subs = this.subscriptions.find(s => s && s.id === id);
                if (subs) {
                    subs.callback(data);
                }
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
        // url validation
        let { url } = this.options;
        if (typeof url !== 'string') {
            throw new CustomError('websocket_no_url');
        }

        if (url.startsWith('https')) {
            url = url.replace('https', 'wss');
        }
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }
        if (!url.endsWith('/websocket')) {
            const suffix = url.endsWith('/') ? 'websocket' : '/websocket';
            url += suffix;
        }

        // set connection timeout before WebSocket initialization
        // it will be be cancelled by this.init or this.dispose after the error
        this.setConnectionTimeout();

        // create deferred promise
        const dfd = createDeferred<void>(-1);

        // initialize connection,
        // options are not used in web builds (see ./src/utils/ws)
        const ws = new WebSocket(url, {
            agent: this.options.agent,
            headers: {
                Origin: 'https://node.trezor.io',
                'User-Agent': 'Trezor Suite',
            },
        });
        if (typeof ws.setMaxListeners === 'function') {
            ws.setMaxListeners(Infinity);
        }
        ws.once('error', error => {
            this.dispose();
            dfd.reject(new CustomError('websocket_runtime_error', error.message));
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
            throw Error('Blockbook websocket init cannot be called');
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

    getServerInfo() {
        return this.send('getInfo');
    }

    getBlockHash(block: number) {
        return this.send('getBlockHash', { height: block });
    }

    getAccountInfo(payload: AccountInfoParams) {
        return this.send('getAccountInfo', payload);
    }

    getAccountUtxo(descriptor: string) {
        return this.send('getAccountUtxo', { descriptor });
    }

    getTransaction(txid: string) {
        return this.send('getTransaction', { txid });
    }

    pushTransaction(hex: string) {
        return this.send('sendTransaction', { hex });
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('estimateFee', payload);
    }

    getCurrentFiatRates(payload: GetCurrentFiatRates['payload']) {
        return this.send('getCurrentFiatRates', payload);
    }

    getAccountBalanceHistory(payload: AccountBalanceHistoryParams) {
        return this.send('getBalanceHistory', payload);
    }

    getFiatRatesForTimestamps(payload: GetFiatRatesForTimestamps['payload']) {
        return this.send('getFiatRatesForTimestamps', payload);
    }

    getFiatRatesTickersList(payload: GetFiatRatesTickersList['payload']) {
        return this.send('getFiatRatesTickersList', payload);
    }

    private removeSubscription(type: Subscription['type']) {
        const index = this.subscriptions.findIndex(s => s.type === type);
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
        }
        return index;
    }

    subscribeAddresses(addresses: string[]) {
        this.removeSubscription('notification');

        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'notification',
            callback: (result: AddressNotification) => {
                this.emit('notification', result);
            },
        });
        return this.send('subscribeAddresses', { addresses });
    }

    unsubscribeAddresses() {
        const index = this.removeSubscription('notification');
        if (index >= 0) {
            return this.send('unsubscribeAddresses');
        }
        return { subscribed: false };
    }

    subscribeBlock() {
        this.removeSubscription('block');

        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'block',
            callback: (result: BlockNotification) => {
                this.emit('block', result);
            },
        });
        return this.send('subscribeNewBlock');
    }

    unsubscribeBlock() {
        const index = this.removeSubscription('block');

        if (index >= 0) {
            return this.send('unsubscribeNewBlock');
        }
        return { subscribed: false };
    }

    subscribeFiatRates(currency?: string) {
        this.removeSubscription('fiatRates');

        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'fiatRates',
            callback: (result: FiatRatesNotification) => {
                this.emit('fiatRates', result);
            },
        });
        return this.send('subscribeFiatRates', { currency });
    }

    unsubscribeFiatRates() {
        const index = this.removeSubscription('fiatRates');
        if (index >= 0) {
            return this.send('unsubscribeFiatRates');
        }
        return { subscribed: false };
    }

    subscribeMempool() {
        this.removeSubscription('mempool');

        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'mempool',
            callback: result => {
                this.emit('mempool', result);
            },
        });
        return this.send('subscribeNewTransaction');
    }

    unsubscribeMempool() {
        const index = this.removeSubscription('mempool');
        if (index >= 0) {
            return this.send('unsubscribeNewTransaction');
        }
        return { subscribed: false };
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
