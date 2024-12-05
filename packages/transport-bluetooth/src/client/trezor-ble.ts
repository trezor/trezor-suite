import { WebsocketClient } from '@trezor/websocket-client';

import {
    TrezorBleSettings,
    NotificationEvent,
    BluetoothDevice,
    BluetoothInfo,
    Logger,
} from './types';

// Client for trezor-ble websocket server
export class TrezorBle extends WebsocketClient<NotificationEvent> {
    readonly settings: TrezorBleSettings;
    readonly logger: Logger;
    private devices: BluetoothDevice[] = [];

    constructor(settings: TrezorBleSettings) {
        super({ url: 'a' });
        this.settings = Object.freeze(settings);
        this.logger = settings.logger || {
            debug: (..._args: string[]) => {},
            log: (..._args: string[]) => {},
            warn: (..._args: string[]) => {},
            error: (..._args: string[]) => {},
        };
    }

    createWebsocket() {
        return this.initWebsocket({
            url: 'ws://127.0.0.1:21327',
            // headers: {
            //     Origin: 'https://node.trezor.io',
            //     'User-Agent': 'Trezor Suite',
            // },
        });
    }

    ping() {
        // return Promise.resolve();
        return this.sendMessage({ method: { name: 'ping', args: [] } });
    }

    // private init() {
    //     const { ws } = this;
    //     if (!ws || !this.isConnected()) {
    //         throw Error('Websocket init cannot be called');
    //     }

    //     // remove previous listeners and add new listeners
    //     ws.removeAllListeners();
    //     ws.on('error', this.onError.bind(this));
    //     // ws.on('message', this.onMessage.bind(this));
    //     const om = this.onMessage.bind(this);
    //     // ws.onmessage = function (evt) {
    //     //     om(evt as any);
    //     // };
    //     ws.on('message', evt => om(evt as any));
    //     ws.on('close', () => {
    //         this.onClose();
    //         this.emit('api_disconnected');
    //     });

    //     const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
    //         this.devices = devices.sort((a, b) => a.timestamp - b.timestamp);
    //     };

    //     this.on('device_connected', transportApiEvent);
    //     this.on('device_disconnected', transportApiEvent);
    // }

    public getDevices() {
        return this.devices;
    }

    send(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    send(method: 'enumerate'): Promise<BluetoothDevice[]>;
    send(method: 'start_scan'): Promise<BluetoothDevice[]>;
    send(method: 'stop_scan'): Promise<boolean>;
    send(method: 'connect_device', uuid: string): Promise<boolean>;
    send(method: 'disconnect_device', uuid: string): Promise<boolean>;
    send(method: 'forget_device', uuid: string): Promise<boolean>;
    send(method: 'open_device', uuid: string): Promise<boolean>;
    send(method: 'close_device', uuid: string): Promise<boolean>;
    send(method: 'read', uuid: string): Promise<boolean>;
    send(method: 'write', args: [string, number[]]): Promise<boolean>;
    // public send(method: string, ...args: any[]) {
    public send(method: string, args?: any) {
        // const { ws } = this;
        // if (!ws) throw new Error('websocket_not_initialized');

        // const { promiseId, promise } = this.messages.create();
        // const req = {
        //     id: promiseId,
        //     // method: { name: method, args: [...args] },
        //     method: { name: method, args: args || [] },
        // };
        // ws.send(JSON.stringify(req));

        return this.sendMessage({ method: { name: method, args: args || [] } });
    }

    protected onMessage(message: string | Buffer) {
        // Websocket.Data
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
