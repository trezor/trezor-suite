import { WebsocketClient } from '@trezor/websocket-client';

import {
    BluetoothDevice,
    BluetoothInfo,
    Logger,
    NotificationEvent,
    TrezorBluetoothSettings,
} from './types';

type SetStateParams = {
    devices: Pick<BluetoothDevice, 'id' | 'macAddress'>[];
};

type ConnectDeviceParams = {
    id: string;
    timeout: number;
};

type WriteParams = {
    id: string;
    data: number[];
    withResponse?: boolean;
};

// Client for trezor-bluetooth rust websocket server
export class TrezorBluetooth extends WebsocketClient<NotificationEvent> {
    readonly settings: TrezorBluetoothSettings;
    readonly logger: Logger;

    constructor(settings: TrezorBluetoothSettings) {
        super({
            url: settings.url,
            keepAlive: true,
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

    connectDevice(params: ConnectDeviceParams) {
        // adjust websocket timeout and allow the server to respond with timeout error (timeout on the server)
        const wsTimeout =
            typeof params.timeout === 'number' && params.timeout > 0
                ? params.timeout + 3000
                : undefined;

        return this.sendMessage({ method: 'connect_device', params }, { timeout: wsTimeout });
    }

    write(params: WriteParams) {
        const withResponse = false;

        return this.sendMessage({ method: 'write', params: { ...params, withResponse } });
    }

    send(method: 'set_state', state: SetStateParams): Promise<boolean>;
    send(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    send(method: 'enumerate'): Promise<BluetoothDevice[]>;
    send(method: 'start_scan'): Promise<BluetoothDevice[]>;
    send(method: 'stop_scan'): Promise<boolean>;
    send(method: 'connect_device', params: ConnectDeviceParams): Promise<boolean>; // args: id, timeout
    send(method: 'disconnect_device', id: string): Promise<boolean>;
    send(method: 'forget_device', id: string): Promise<boolean>;
    send(method: 'open_device', id: string): Promise<boolean>;
    send(method: 'close_device', id: string): Promise<boolean>;
    send(method: 'read', id: string): Promise<boolean>;
    send(method: 'write', params: WriteParams): Promise<boolean>;
    public send(method: string, params?: any) {
        if (method === 'connect_device') {
            return this.connectDevice(params);
        }

        if (method === 'write') {
            return this.write(params);
        }

        return this.sendMessage({ method, params });
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
