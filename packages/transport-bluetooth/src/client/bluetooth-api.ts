import {
    AbstractApi,
    AbstractApiConstructorParams,
    DEVICE_TYPE,
} from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import { PathInternal } from '@trezor/transport/src/types';
import { readMessageBuffer } from '@trezor/transport/src/utils/readMessageBuffer';

import { TrezorBluetooth } from './trezor-bluetooth';
import { BluetoothDevice } from './types';

// implementation of @trezor/transport/src/api/abstract

type BluetoothApiParams = AbstractApiConstructorParams & {
    url: string;
};

export class BluetoothApi extends AbstractApi {
    chunkSize = 244;
    api: TrezorBluetooth;
    private readBuffer = readMessageBuffer();

    constructor(options: BluetoothApiParams) {
        super(options);

        this.api = new TrezorBluetooth({ url: options.url, logger: options.logger });
    }

    private devicesToDescriptors(devices: BluetoothDevice[]) {
        return devices
            .filter(device => device.connected && device.paired)
            .map(device => ({
                path: device.id as PathInternal,
                type: DEVICE_TYPE.TypeBluetooth,
                id: device.id,
            }));
    }

    async init() {
        const { api } = this;
        try {
            await api.connect();
        } catch (error) {
            return this.error({ error: ERRORS.UNEXPECTED_ERROR, message: error.message });
        }

        return this.success(true);
    }

    enumerate() {
        return this.api
            .send('enumerate')
            .then(devices => this.success(this.devicesToDescriptors(devices)))
            .catch(() => this.success([]));
    }

    listen() {
        const { api } = this;

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('transport-interface-change', this.devicesToDescriptors(devices));
        };
        api.on('device_connected', transportApiEvent);
        api.on('device_disconnected', event => {
            this.readBuffer.cancelRead(event.id);
            transportApiEvent(event);
        });
        api.on('device_read', ({ id, data }) => {
            this.readBuffer.onMessage(id, Buffer.from(data));
        });
        api.on('adapter_state_changed', ({ state }) => {
            if (state !== 'enabled') {
                transportApiEvent({ devices: [] });
            }
        });
        api.on('disconnected', () => {
            this.emit('transport-interface-error', { error: ERRORS.API_DISCONNECTED });
        });
    }

    dispose() {
        this.api.removeAllListeners();

        return this.api.disconnect();
    }

    read(path: string, signal?: AbortSignal) {
        return this.readBuffer.read(path, signal);
    }

    write(path: string, buffer: Buffer) {
        return this.api
            .send('write', [path, Array.from(buffer)])
            .then(() => this.success(undefined))
            .catch(e => this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: e.message }));
    }

    openDevice(path: string) {
        return this.api
            .send('open_device', path)
            .then(() => this.success(undefined))
            .catch(e =>
                this.error({ error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE, message: e.message }),
            );
    }

    closeDevice(path: string) {
        this.readBuffer.cancelRead(path);

        return this.api
            .send('close_device', path)
            .then(() => this.success(undefined))
            .catch(e =>
                this.error({ error: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE, message: e.message }),
            );
    }
}
