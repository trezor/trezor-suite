import WebSocket from 'ws';

import { TypedEmitter } from '@trezor/utils/src/typedEventEmitter';
import { createDeferred } from '@trezor/utils/src/createDeferred';
import { createDeferredManager } from '@trezor/utils/src/createDeferredManager';

import { TrezorBleSettings, NotificationEvent, BluetoothDevice, Logger } from './types';

interface TrezorBleEvents extends NotificationEvent {
    ApiDisconnected: void;
}

const DEFAULT_TIMEOUT = 31 * 1000;

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
            await new Promise<void>(resolve => this.once('ApiDisconnected', resolve));
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
            this.emit('ApiDisconnected');
        });

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.devices = devices;
        };

        this.on('DeviceDiscovered', transportApiEvent);
        this.on('DeviceConnected', transportApiEvent);
        this.on('DeviceDisconnected', transportApiEvent);
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

    sendMessage(method: 'get_info'): Promise<any>;
    sendMessage(method: 'start_scan'): Promise<any>;
    sendMessage(method: 'stop_scan'): Promise<any>;
    sendMessage(method: 'connect_device', uuid: string): Promise<any>;
    sendMessage(method: 'disconnect_device', uuid: string): Promise<any>;
    sendMessage(method: 'open_device', uuid: string): Promise<any>;
    sendMessage(method: 'close_device', uuid: string): Promise<any>;
    sendMessage(method: 'read', uuid: string): Promise<any>;
    sendMessage(method: 'write', args: [string, number[]]): Promise<any>;
    public sendMessage(method: string, args?: any) {
        const { ws } = this;
        if (!ws) throw new Error('websocket_not_initialized');

        console.warn('-->sending', method, args);

        const { promiseId, promise } = this.messages.create();
        const req = {
            id: promiseId,
            method: { name: method, args: args || [] },
        };
        ws.send(JSON.stringify(req));

        return promise;
    }

    // TODO: receiving buffer not string?
    protected onMessage(message: WebSocket.Data) {
        try {
            const resp = JSON.parse(message.toString());
            const { id, payload } = resp;

            if (resp.event) {
                this.emit(resp.event, payload);

                return;
            }

            const messageSettled = payload.error
                ? this.messages.reject(Number(id), new Error(payload.error.message))
                : this.messages.resolve(Number(id), payload);

            if (!messageSettled) {
                console.warn('not settled?', resp);
            }
        } catch (error) {
            // empty
        }
    }
}
