import { EventEmitter } from 'events';
import { fail } from '../utils';
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
    protected callbacks: CallbackMessageQueue = {};
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
            throw new Error(`JSON RPC connection failed: [${err}]`);
        }
    }

    connected() {
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
            this.send(request);
        });
    }

    on(event: string, listener: (...args: any[]) => void) {
        this.emitter.on(event, listener);
    }

    off(event: string, listener: (...args: any[]) => void) {
        this.emitter.off(event, listener);
    }

    protected send(message: string) {
        const socket = this.socket || fail('Connection not established');
        this.log('SENDING:', message);
        socket.send(`${message}\n`);
    }

    protected response(response: any) {
        const { id, method, params, result, error } = response;
        if (!id) {
            // Notification
            this.emitter.emit(method, params);
        } else {
            // Response
            const callback = this.callbacks[id];
            if (callback) {
                delete this.callbacks[id];
                callback(error, result);
            } else {
                this.log(`Can't get callback for ${id}`);
            }
        }
    }

    protected onMessage(body: string) {
        const msg = JSON.parse(body);
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
            console.log(...data);
        }
    }
}
