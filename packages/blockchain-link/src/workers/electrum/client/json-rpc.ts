import { EventEmitter } from 'events';

import type { ISocket } from '../sockets/interface';

type Callback = (error: any, result?: any) => void;
type CallbackMessageQueue = Record<number, Callback>;

export type JsonRpcClientOptions = {
    debug?: boolean;
};

export class JsonRpcClient {
    private id = 0;
    private buffer = '';
    private emitter = new EventEmitter();
    private callbacks: CallbackMessageQueue = {};
    protected socket?: ISocket;
    protected debug = false;

    async connect(socket: ISocket, options?: JsonRpcClientOptions) {
        if (this.socket) return;

        this.debug = options?.debug || false;

        try {
            this.socket = socket;
            await this.socket.connect(this);
        } catch (err) {
            this.socket = undefined;
            throw Object.assign(new Error(`JSON RPC connection failed: [${err}]`), { cause: err });
        }
    }

    isConnected() {
        return !!this.socket;
    }

    close() {
        this.socket?.close();
        this.socket = undefined;
        this.onClose();
    }

    request(method: string, ...params: any[]) {
        return new Promise<any>((resolve, reject) => {
            const id = ++this.id;
            const request = JSON.stringify({
                jsonrpc: '2.0',
                method,
                params,
                id,
            });
            this.callbacks[id] = (err, result) => {
                if (err) reject(err);
                else resolve(result);
            };
            this.send(id, request);
        });
    }

    on(event: string, listener: (...args: any[]) => void) {
        this.emitter.on(event, listener);
    }

    off(event: string, listener: (...args: any[]) => void) {
        this.emitter.off(event, listener);
    }

    protected send(id: number, message: string) {
        if (this.socket) {
            this.log('SENDING:', message);
            this.socket.send(`${message}\n`);
        } else {
            this.processCallback(id, new Error('Connection not established'));
        }
    }

    protected response(response: any) {
        try {
            const { id, method, params, result, error } = response;
            if (id) {
                this.processCallback(id, error, result);
            } else {
                this.emitter.emit(method, params);
            }
        } catch (err) {
            // The Electrum server is untrusted (user-selectable, incl. custom addresses).
            // A misshapen response — a non-object line (e.g. `null`, which throws on
            // destructuring) or subscription params a handler doesn't expect (e.g. onBlock's
            // `blocks.sort` on a non-array) — must never throw out of the synchronous socket
            // 'data' listener, where it would surface as an uncaughtException and tear down
            // the worker (remote DoS). Guarding only JSON.parse in onMessage is not enough:
            // this dispatch step consumes the parsed data and runs outside that try/catch.
            this.log('Failed to dispatch message:', err);
        }
    }

    private processCallback(id: number, error: any, result?: any) {
        const callback = this.callbacks[id];
        if (callback) {
            delete this.callbacks[id];
            callback(error, result);
        } else {
            this.log(`Can't get callback for ${id}`);
        }
    }

    protected onMessage(body: string) {
        let msg;
        try {
            msg = JSON.parse(body);
        } catch {
            // The Electrum server is untrusted (user-selectable, incl. custom addresses).
            // A malformed line must never throw out of the socket 'data' listener, where it
            // would surface as an uncaughtException and tear down the worker (remote DoS).
            this.log('Failed to parse message:', body);

            return;
        }
        this.log('RECEIVED:', msg);
        this.response(msg);
    }

    onConnect() {
        this.log('onConnect');
    }

    onReceive(chunk: string) {
        const msgs = (this.buffer + chunk).split('\n');
        this.buffer = msgs.pop() || '';
        msgs.filter(msg => !!msg).forEach(this.onMessage, this);
    }

    onEnd(e: unknown) {
        this.log(`onEnd: [${e}]`);
    }

    onError(error: unknown) {
        this.log(`onError: [${error}]`);
    }

    onClose() {
        this.log('onClose');
        Object.values(this.callbacks).forEach(cb => cb(new Error('Connection closed')));
        this.callbacks = {};
        this.emitter.removeAllListeners();
    }

    protected log(...data: any[]) {
        if (this.debug) {
            // eslint-disable-next-line no-console
            console.log(...data);
        }
    }
}
