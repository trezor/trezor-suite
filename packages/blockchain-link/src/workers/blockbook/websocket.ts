import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { CustomError } from '../../constants/errors';
import { create as createDeferred, Deferred } from '../../utils/deferred';
import {
    AccountInfoParams,
    AccountUtxoParams,
    EstimateFeeParams,
    BlockNotification,
    AddressNotification,
    Send,
} from '../../types/blockbook';

const NOT_INITIALIZED = new CustomError('websocket_not_initialized');

interface Subscription {
    id: string;
    type: 'notification' | 'block';
    callback: (result: any) => void;
}

export default class Socket extends EventEmitter {
    url: string;

    ws: WebSocket | undefined;

    messages: Deferred<any>[] = [];

    subscriptions: Subscription[] = [];

    constructor(url: string) {
        super();
        this.setMaxListeners(Infinity);
        this.url = url;
    }

    send: Send = (method, params) => {
        const { ws } = this;
        if (!ws) throw NOT_INITIALIZED;
        const id = this.messages.length.toString();

        const dfd = createDeferred(id);
        const req = {
            id,
            method,
            params,
        };
        this.messages.push(dfd);
        ws.send(JSON.stringify(req));
        return dfd.promise as Promise<any>;
    };

    onmessage(message: string) {
        try {
            const resp = JSON.parse(message);
            const { id, data } = resp;
            const dfd = this.messages[id];
            // console.log('WS message', resp, dfd);
            if (dfd) {
                if (data.error) {
                    dfd.reject(new CustomError('websocket_error_message', data.error.message));
                } else {
                    dfd.resolve(data);
                }
                delete this.messages[id];
            } else {
                const subs = this.subscriptions.find(s => s && s.id === id);
                if (subs) {
                    subs.callback(data);
                } else {
                    console.log(`unknown response ${id}`);
                }
            }
        } catch (error) {
            // empty
        }
    }

    connect() {
        // this._clearReconnectTimer()

        if (typeof this.url !== 'string') {
            throw new CustomError('websocket_no_url');
        }

        if (this.url.startsWith('https')) {
            this.url = this.url.replace('https', 'wss');
        }
        if (this.url.startsWith('http')) {
            this.url = this.url.replace('http', 'ws');
        }
        if (!this.url.endsWith('/websocket')) {
            const suffix = this.url.endsWith('/') ? 'websocket' : '/websocket';
            this.url += suffix;
        }

        const dfd = createDeferred<void>(-1);

        const ws = new WebSocket(this.url);
        if (typeof ws.setMaxListeners === 'function') {
            ws.setMaxListeners(Infinity);
        }
        ws.once('error', error => {
            dfd.reject(new CustomError('websocket_runtime_error', error.message));
        });
        ws.on('message', this.onmessage.bind(this));
        // ws.on('ping', a => {
        //     console.log('PING!', a);
        // });

        // this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this, true, resolve, reject)
        // this._ws.once('close', this._onUnexpectedCloseBound)
        ws.on('open', dfd.resolve);
        ws.on('close', () => {
            this.emit('disconnected');
        });
        this.ws = ws;

        return dfd.promise;
    }

    cleanup() {}

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.cleanup();
    }

    isConnected() {
        const { ws } = this;
        return ws && ws.readyState === WebSocket.OPEN;
    }

    getServerInfo() {
        return this.send('getInfo', {});
    }

    getAccountInfo(payload: AccountInfoParams) {
        return this.send('getAccountInfo', payload);
    }

    getAccountUtxo(payload: AccountUtxoParams) {
        return this.send('getAccountUtxo', payload);
    }

    getTransaction(txid: string) {
        return this.send('getTransaction', { txid });
    }

    pushTransaction(hex: string) {
        return this.send('sendTransaction', { hex });
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('estimateFee', payload);
        // return this._send('estimateFee', {
        //     blocks: [2, 5, 10, 200],
        //     specific: undefined, // { conservative: boolean, txsize: number } // { from: '0x0', to: '0x0', data: '0xdeadbeef' }
        // });
    }

    subscribeAddresses(addresses: string[]) {
        const index = this.subscriptions.findIndex(s => s && s.type === 'notification');
        if (index >= 0) {
            // remove previous subscriptions
            delete this.subscriptions[index];
        }
        // add new subscription
        const id = this.messages.length.toString();
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
        const index = this.subscriptions.findIndex(s => s && s.type === 'notification');
        if (index >= 0) {
            // remove previous subscriptions
            delete this.subscriptions[index];
            return this.send('unsubscribeAddresses', {});
        }
        return { subscribed: false };
    }

    subscribeBlock() {
        const index = this.subscriptions.findIndex(s => s && s.type === 'block');
        if (index >= 0) {
            // remove previous subscriptions
            delete this.subscriptions[index];
        }
        // add new subscription
        const id = this.messages.length.toString();
        this.subscriptions.push({
            id,
            type: 'block',
            callback: (result: BlockNotification) => {
                this.emit('block', result);
            },
        });
        return this.send('subscribeNewBlock', {});
    }

    unsubscribeBlock() {
        const index = this.subscriptions.findIndex(s => s && s.type === 'block');
        if (index >= 0) {
            // remove previous subscriptions
            delete this.subscriptions[index];
            return this.send('unsubscribeNewBlock', {});
        }
        return { subscribed: false };
    }
}
