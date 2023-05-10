import WebSocket from 'ws';
import { createDeferred, Deferred } from '@trezor/utils/lib/createDeferred';
import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import type {
    Send,
    BlockContent,
    BlockfrostTransaction,
} from '@trezor/blockchain-link-types/lib/blockfrost';
import type {
    AccountInfoParams,
    EstimateFeeParams,
    AccountBalanceHistoryParams,
} from '@trezor/blockchain-link-types/lib/params';

const NOT_INITIALIZED = new CustomError('websocket_not_initialized');

interface Subscription {
    id: string;
    type: 'block' | 'notification';
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

export declare interface BlockfrostEvents {
    block: BlockContent;
    notification: BlockfrostTransaction;
    error: string;
    disconnected: undefined;
}

export class BlockfrostAPI extends TypedEmitter<BlockfrostEvents> {
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
                await this.getBlockHash(1);
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

    send: Send = (command, params = {}) => {
        const { ws } = this;
        if (!ws) throw NOT_INITIALIZED;
        const id = this.messageID.toString();

        const dfd = createDeferred(id);
        const req = {
            id,
            command,
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
        const { url } = this.options;
        this.setConnectionTimeout();
        const dfd = createDeferred<void>(-1);
        // options are not used in web builds (see ./src/utils/ws)
        const ws = new WebSocket(url, {
            agent: this.options.agent,
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

        return dfd.promise;
    }

    init() {
        const { ws } = this;
        if (!ws || !this.isConnected()) {
            throw Error('Blockfrost websocket init cannot be called');
        }

        this.clearConnectionTimeout();
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
    }

    isConnected() {
        const { ws } = this;
        return ws && ws.readyState === WebSocket.OPEN;
    }

    getServerInfo() {
        return this.send('GET_SERVER_INFO');
    }

    getBlockHash(number: number) {
        return this.send('GET_BLOCK', { hashOrNumber: number });
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('ESTIMATE_FEE', payload);
    }

    getAccountInfo(payload: AccountInfoParams) {
        return this.send('GET_ACCOUNT_INFO', payload);
    }

    getAccountUtxo(descriptor: string) {
        return this.send('GET_ACCOUNT_UTXO', { descriptor });
    }

    getAccountBalanceHistory(payload: AccountBalanceHistoryParams) {
        return this.send('GET_BALANCE_HISTORY', payload);
    }

    getTransaction(txId: string) {
        return this.send('GET_TRANSACTION', { txId });
    }

    pushTransaction(txData: string) {
        return this.send('PUSH_TRANSACTION', { txData });
    }

    subscribeBlock() {
        const index = this.subscriptions.findIndex(s => s.type === 'block');

        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
        }

        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'block',
            callback: (result: BlockContent) => {
                this.emit('block', result);
            },
        });

        return this.send('SUBSCRIBE_BLOCK');
    }

    subscribeAddresses(addresses: string[]) {
        const index = this.subscriptions.findIndex(s => s.type === 'notification');
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
        }
        // add new subscription
        const id = this.messageID.toString();
        this.subscriptions.push({
            id,
            type: 'notification',
            callback: (result: any) => {
                this.emit('notification', result);
            },
        });

        return this.send('SUBSCRIBE_ADDRESS', { addresses });
    }

    unsubscribeBlock() {
        const index = this.subscriptions.findIndex(s => s.type === 'block');
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
            return this.send('UNSUBSCRIBE_BLOCK');
        }
        return {
            subscribed: false,
        };
    }

    unsubscribeAddresses() {
        const index = this.subscriptions.findIndex(s => s.type === 'notification');
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
            return this.send('UNSUBSCRIBE_ADDRESS');
        }
        return {
            subscribed: false,
        };
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
