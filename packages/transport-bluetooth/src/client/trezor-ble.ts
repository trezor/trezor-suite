import WebSocket from 'ws';

import { TypedEmitter, createDeferredManager, createDeferred } from '@trezor/utils';

import {
    TrezorBleSettings,
    NotificationEvent,
    BluetoothDevice,
    BluetoothInfo,
    Logger,
} from './types';

interface TrezorBleEvents extends NotificationEvent {
    api_disconnected: void;
}

// TODO: no timeout
const DEFAULT_TIMEOUT = 1000 * 1000;

// Client for trezor-ble websocket server
export class TrezorBle extends TypedEmitter<TrezorBleEvents> {
    readonly settings: TrezorBleSettings;
    readonly logger: Logger;
    private ws?: WebSocket;
    private connectPromise?: Promise<void>;
    private readonly messages;
    private devices: BluetoothDevice[] = [];

    constructor(settings: TrezorBleSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.logger = settings.logger || {
            debug: (..._args: string[]) => {},
            log: (..._args: string[]) => {},
            warn: (..._args: string[]) => {},
            error: (..._args: string[]) => {},
        };
        this.messages = createDeferredManager({
            timeout: this.settings.timeout || DEFAULT_TIMEOUT,
            onTimeout: this.onTimeout.bind(this),
        });
    }

    async connect() {
        // if connecting already, just return the promise
        if (this.connectPromise) {
            return this.connectPromise;
        }

        if (this.ws?.readyState === WebSocket.CLOSING) {
            await new Promise<void>(resolve => this.once('api_disconnected', resolve));
        }

        // create deferred promise
        const dfd = createDeferred(-1);
        this.connectPromise = dfd.promise;

        // let { url } = this.options;

        const ws = new WebSocket('ws://127.0.0.1:21327', {
            headers: {
                Origin: 'https://node.trezor.io',
                'User-Agent': 'Trezor Suite',
            },
        });

        ws.once('error', error => {
            this.onClose();
            dfd.reject(new Error(error.message));
        });
        ws.on('open', () => {
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
        ws.on('error', this.onError.bind(this));
        // ws.on('message', this.onMessage.bind(this));
        const om = this.onMessage.bind(this);
        // ws.onmessage = function (evt) {
        //     om(evt as any);
        // };
        ws.on('message', evt => om(evt as any));
        ws.on('close', () => {
            this.onClose();
            this.emit('api_disconnected');
        });

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.devices = devices.sort((a, b) => a.timestamp - b.timestamp);
        };

        this.on('device_connected', transportApiEvent);
        this.on('device_disconnected', transportApiEvent);
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    disconnect() {
        this.ws?.close();
    }

    private onError() {
        this.onClose();
    }

    private onTimeout() {
        const { ws } = this;
        if (!ws) return;
        this.messages.rejectAll(new Error('websocket_timeout'));
        ws.close();
    }

    private onClose() {
        if (this.isConnected()) {
            this.disconnect();
        }
        this.ws?.removeAllListeners();
        this.messages.rejectAll(new Error('Websocket closed unexpectedly'));
    }

    public getDevices() {
        return this.devices;
    }

    sendMessage(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    sendMessage(method: 'enumerate'): Promise<BluetoothDevice[]>;
    sendMessage(method: 'start_scan'): Promise<BluetoothDevice[]>;
    sendMessage(method: 'stop_scan'): Promise<boolean>;
    sendMessage(method: 'connect_device', uuid: string): Promise<boolean>;
    sendMessage(method: 'disconnect_device', uuid: string): Promise<boolean>;
    sendMessage(method: 'forget_device', uuid: string): Promise<boolean>;
    sendMessage(method: 'open_device', uuid: string): Promise<boolean>;
    sendMessage(method: 'close_device', uuid: string): Promise<boolean>;
    sendMessage(method: 'read', uuid: string): Promise<boolean>;
    sendMessage(method: 'write', args: [string, number[]]): Promise<boolean>;
    // public sendMessage(method: string, ...args: any[]) {
    public sendMessage(method: string, args?: any) {
        const { ws } = this;
        if (!ws) throw new Error('websocket_not_initialized');

        const { promiseId, promise } = this.messages.create();
        const req = {
            id: promiseId,
            // method: { name: method, args: [...args] },
            method: { name: method, args: args || [] },
        };
        ws.send(JSON.stringify(req));

        return promise;
    }

    protected onMessage(message: WebSocket.Data) {
        try {
            const resp = JSON.parse(message.toString());
            if (resp.event) {
                this.emit(resp.event, resp.payload);

                return;
            }

            const id = Number(resp.id); // TODO
            const messageSettled = resp.error
                ? this.messages.reject(id, new Error(resp.error))
                : this.messages.resolve(id, resp.payload);

            if (!messageSettled) {
                console.warn('not settled?', resp);
            }
        } catch {
            // empty
        }
    }
}
