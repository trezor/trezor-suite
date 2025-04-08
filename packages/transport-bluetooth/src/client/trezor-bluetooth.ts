import { WebsocketClient } from '@trezor/websocket-client';

import {
    BluetoothDevice,
    BluetoothInfo,
    Logger,
    NotificationEvent,
    TrezorBluetoothSettings,
} from './types';

// Client for trezor-bluetooth rust websocket server
export class TrezorBluetooth extends WebsocketClient<NotificationEvent> {
    readonly settings: TrezorBluetoothSettings;
    readonly logger: Logger;

    constructor(settings: TrezorBluetoothSettings) {
        super({
            url: settings.url,
        });
        this.settings = Object.freeze(settings);
        this.logger = settings.logger || {
            info: () => {},
            debug: () => {},
            log: () => {},
            warn: () => {},
            error: () => {},
        };
    }

    createWebsocket() {
        return this.initWebsocket({
            url: this.settings.url,
        });
    }

    ping() {
        return Promise.resolve(this.sendRawMessage('PING'));
    }

    send(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    send(method: 'enumerate'): Promise<BluetoothDevice[]>;
    send(method: 'start_scan'): Promise<BluetoothDevice[]>;
    send(method: 'stop_scan'): Promise<boolean>;
    send(method: 'connect_device', id: string): Promise<boolean>; // TODO: timeout
    send(method: 'disconnect_device', id: string): Promise<boolean>;
    send(method: 'forget_device', id: string): Promise<boolean>;
    send(method: 'open_device', id: string): Promise<boolean>;
    send(method: 'close_device', id: string): Promise<boolean>;
    send(method: 'read', id: string): Promise<boolean>;
    send(method: 'write', args: [string, number[]]): Promise<boolean>;
    public send(method: string, args?: any) {
        return this.sendMessage({ method, params: args || [] });
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
