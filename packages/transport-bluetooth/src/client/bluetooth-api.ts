import {
    AbstractApi,
    type AbstractApiConstructorParams,
    type OpenDeviceChannel,
} from '@trezor/transport/src/api/abstract';
import { DEVICE_TYPE } from '@trezor/transport/src/constants';
import * as ERRORS from '@trezor/transport/src/errors';
import { type PathInternal } from '@trezor/transport/src/types';
import { getBLEDescriptorModel } from '@trezor/transport/src/utils/descriptor';
import { readMessageBuffer } from '@trezor/transport/src/utils/readMessageBuffer';

import { TrezorBluetooth } from './trezor-bluetooth';
import { type BluetoothDevice, type TrezorBluetoothSettings } from './types';

// implementation of @trezor/transport/src/api/abstract

type BluetoothApiParams = Omit<AbstractApiConstructorParams, 'type'> & TrezorBluetoothSettings;

export class BluetoothApi extends AbstractApi {
    chunkSize = 244;
    api: TrezorBluetooth;

    private readBuffer = readMessageBuffer();
    private readSubscription: Record<string, boolean> = {}; // [device.id]: true

    constructor(options: BluetoothApiParams) {
        super({ ...options, type: 'bluetooth' });

        this.api = new TrezorBluetooth(options);
    }

    private devicesToDescriptors(devices: BluetoothDevice[]) {
        return devices
            .filter(device => device.connected && device.paired)
            .map(device => ({
                path: device.id as PathInternal,
                type: DEVICE_TYPE.TypeBluetooth,
                id: device.id,
                apiType: this.type,
                model: getBLEDescriptorModel(device.data[2]),
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
            .then(({ devices }) => this.success(this.devicesToDescriptors(devices)))
            .catch(() => this.success([]));
    }

    listen() {
        const { api } = this;

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('transport-interface-change', this.devicesToDescriptors(devices));
        };
        api.on('device_connected', event => {
            transportApiEvent(event);
        });
        api.on('device_disconnected', event => {
            this.readBuffer.cancelRead(event.id);
            delete this.readSubscription[event.id];
            transportApiEvent(event);
        });
        api.on('device_read', ({ id, data, characteristic }) => {
            if (characteristic === 'trezor-push-notification') {
                this.emit('trezor-push-notification', { id, data });
            } else if (characteristic === 'battery-level') {
                this.emit('battery-level', { id, data });
            } else {
                this.readBuffer.onMessage(id, Buffer.from(data));
            }
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
        const chunk = Buffer.alloc(this.chunkSize);
        buffer.copy(chunk);

        return this.api
            .send('write', { id: path, data: Array.from(chunk) })
            .then(() => this.success(undefined))
            .catch(e => this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: e.message }));
    }

    openDevice(path: string, options?: { channel?: OpenDeviceChannel }) {
        const isReadChannel = !options?.channel || options.channel === 'read';
        if (isReadChannel) {
            this.readBuffer.cancelRead(path);
            if (this.readSubscription[path]) {
                // already subscribed to TX (read) characteristics
                return Promise.resolve(this.success(undefined));
            } else {
                this.readSubscription[path] = true;
            }
        }

        return this.api
            .send('open_device', { id: path, characteristic: options?.channel })
            .then(() => this.success(undefined))
            .catch(e =>
                this.error({ error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE, message: e.message }),
            );
    }

    closeDevice(path: string, options?: { channel?: OpenDeviceChannel }) {
        const isReadChannel = !options?.channel || options.channel === 'read';
        if (isReadChannel) {
            // do not close subscriptions to TX (read) characteristics
            this.readBuffer.cancelRead(path);

            return Promise.resolve(this.success(undefined));
        }

        return this.api
            .send('close_device', { id: path, characteristic: options?.channel })
            .then(() => this.success(undefined))
            .catch(e =>
                this.error({ error: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE, message: e.message }),
            );
    }
}
