import { resolveAfter } from '@trezor/utils';
import { WebsocketClient } from '@trezor/websocket-client';

import {
    type BluetoothDevice,
    type BluetoothInfo,
    type NotificationCharacteristic,
    type NotificationEvent,
    type TrezorBluetoothSettings,
} from './types';

// reflection of rust params ./src/server/types.rs

type SetStateParams = {
    devices: Pick<BluetoothDevice, 'id' | 'macAddress'>[];
};

type ConnectDeviceParams = {
    id: string;
    timeout: number;
};

type DisconnectDeviceParams = {
    id: string;
};

type ForgetDeviceParams = {
    id: string;
};

type OpenDeviceParams = {
    id: string;
    characteristic?: NotificationCharacteristic;
};

type CloseDeviceParams = {
    id: string;
    characteristic?: NotificationCharacteristic;
};

type WriteParams = {
    id: string;
    data: number[];
    withResponse?: boolean;
};

type ReadParams = {
    id: string;
};

// WsResponsePayload::Success
type Success = { success: boolean };

// Client for trezor-bluetooth rust websocket server
export class TrezorBluetooth extends WebsocketClient<NotificationEvent> {
    readonly settings: TrezorBluetoothSettings;

    constructor(settings: TrezorBluetoothSettings) {
        super({
            url: settings.url,
            keepAlive: true,
        });
        this.settings = Object.freeze(settings);
    }

    onMessageTimeout(promiseId: number) {
        this.messages.reject(promiseId, new Error('websocket_timeout'));
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

    private writeBuffer: Record<string, { bytes: number; lastWrite: number } | undefined> = {};

    private async write(params: WriteParams) {
        const writeBuffer = this.writeBuffer[params.id];
        if (!writeBuffer) {
            throw new Error('Device not opened');
        }

        // MacOS and Windows writeWithoutResponse sends packets faster than Trezor is able to process or just loose packets and doesn't send them at all (macos)
        // we need to use throttle it to make sure that they are received and processed correctly
        // NOTE: the faster it sends the longer it waits when withResponse is used
        const MIN_PACKETS = 8;
        const MAX_PACKETS = 16;
        const PACKET_SIZE = 244;
        const WITH_RESPONSE_BYTES = PACKET_SIZE * MAX_PACKETS;
        let withResponse = false;
        const lastWrite = Date.now() - writeBuffer.lastWrite;
        // windows: use delay between packets. do not use writeWithResponse - it takes too long
        if (this.settings.writeWithDelay && lastWrite < MIN_PACKETS) {
            const wait =
                MIN_PACKETS -
                lastWrite +
                Math.floor(MIN_PACKETS * ((writeBuffer.bytes / WITH_RESPONSE_BYTES) % 1));
            await resolveAfter(wait);
        }

        // macos: use writeWithResponse occasionally (first few packets and every 16-nth)
        if (this.settings.writeWithResponse) {
            const sent = writeBuffer.bytes / PACKET_SIZE;
            if (sent <= MIN_PACKETS || sent % WITH_RESPONSE_BYTES === 0) {
                withResponse = true;
            }
        }

        writeBuffer.lastWrite = Date.now();
        writeBuffer.bytes += params.data.length;

        return this.sendMessage({ method: 'write', params: { ...params, withResponse } });
    }

    send(method: 'set_state', state: SetStateParams): Promise<Success>;
    send(method: 'get_info', adapter?: boolean): Promise<BluetoothInfo>;
    send(method: 'enumerate'): Promise<{ devices: BluetoothDevice[] }>;
    send(method: 'start_scan'): Promise<{ devices: BluetoothDevice[] }>;
    send(method: 'stop_scan'): Promise<Success>;
    send(method: 'connect_device', params: ConnectDeviceParams): Promise<Success>;
    send(method: 'disconnect_device', params: DisconnectDeviceParams): Promise<Success>;
    send(method: 'forget_device', params: ForgetDeviceParams): Promise<Success>;
    send(method: 'open_device', params: OpenDeviceParams): Promise<Success>;
    send(method: 'close_device', params: CloseDeviceParams): Promise<Success>;
    send(method: 'read', params: ReadParams): Promise<{ data: number[] }>;
    send(method: 'write', params: WriteParams): Promise<Success>;
    public send(method: string, params?: any) {
        if (method === 'connect_device') {
            return this.connectDevice(params);
        }

        if (method === 'write') {
            return this.write(params);
        }

        if (method === 'open_device') {
            this.writeBuffer[params.id] = {
                bytes: 0,
                lastWrite: 0,
            };
        }

        if (method === 'close_device') {
            delete this.writeBuffer[params.id];
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
