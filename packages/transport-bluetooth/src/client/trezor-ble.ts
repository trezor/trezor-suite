import { WebsocketClient } from '@trezor/websocket-client';

import {
    BluetoothDevice,
    BluetoothInfo,
    Logger,
    NotificationEvent,
    TrezorBleSettings,
} from './types';

export type TODOReq = {
    (method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    (method: 'enumerate'): Promise<BluetoothDevice[]>;
    (method: 'start_scan'): Promise<BluetoothDevice[]>;
    (method: 'stop_scan'): Promise<boolean>;
    (method: 'connect_device', id: string): Promise<boolean>;
    (method: 'disconnect_device', id: string): Promise<boolean>;
    (method: 'forget_device', id: string): Promise<boolean>;
    (method: 'open_device', id: string): Promise<boolean>;
    (method: 'close_device', id: string): Promise<boolean>;
    (method: 'read', id: string): Promise<boolean>;
    (method: 'write', args: [string, number[]]): Promise<boolean>;
    // req: { method: { name: string; args?: [] } };
    // resp: { b: 1 };
};

// Client for trezor-ble websocket server
export class TrezorBle extends WebsocketClient<NotificationEvent> {
    readonly settings: TrezorBleSettings;
    readonly logger: Logger;
    private devices: BluetoothDevice[] = [];

    constructor(settings: TrezorBleSettings) {
        super({
            url: 'ws://127.0.0.1:21327', // TODO: url dynamic, URL NEEDED HERE?
            // pingTimeout: 5000,
        });
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
            url: 'ws://127.0.0.1:21327', // TODO: url dynamic
            headers: {
                Origin: 'https://node.trezor.io',
                'User-Agent': 'Trezor Suite',
            },
        });
    }

    ping() {
        return Promise.resolve(this.sendRawMessage('PING'));
    }

    public getDevices() {
        return this.devices;
    }

    send(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    send(method: 'enumerate'): Promise<BluetoothDevice[]>;
    send(method: 'start_scan'): Promise<BluetoothDevice[]>;
    send(method: 'stop_scan'): Promise<boolean>;
    send(method: 'connect_device', id: string): Promise<boolean>;
    send(method: 'disconnect_device', id: string): Promise<boolean>;
    send(method: 'forget_device', id: string): Promise<boolean>;
    send(method: 'open_device', id: string): Promise<boolean>;
    send(method: 'close_device', id: string): Promise<boolean>;
    send(method: 'read', id: string): Promise<boolean>;
    send(method: 'write', args: [string, number[]]): Promise<boolean>;
    public send(method: string, args?: any) {
        return this.sendMessage({ method: { name: method, args: args || [] } });
    }

    protected onMessage(message: string | Buffer) {
        super.onMessage(message, data => {
            if (data.event) {
                this.emit(data.event, data.payload);

                return;
            }
            if (data.error) {
                throw new Error(data.error);
            }

            return data.payload;
        });
    }
}
