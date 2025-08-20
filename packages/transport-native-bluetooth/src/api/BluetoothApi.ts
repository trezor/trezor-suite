import { Subscription } from 'react-native-ble-plx';

import {
    AbstractApi,
    AbstractApiConstructorParams,
    DEVICE_TYPE,
} from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import {
    AsyncResultWithTypedError,
    DescriptorApiLevel,
    PathInternal,
} from '@trezor/transport/src/types';

import { bluetoothManager } from './bluetoothManager';

/* eslint-disable require-await */
export class BluetoothApi extends AbstractApi {
    chunkSize = 244;

    private subscription: Subscription;

    constructor(params: AbstractApiConstructorParams) {
        super(params);
        this.subscription = bluetoothManager.onDeviceConnectionStatusChange(event => {
            this.logger?.debug('onDeviceConnectionStatusChange', event);
            this.emit('transport-interface-change', this.getDescriptors());
        });
    }

    public async enumerate() {
        this.logger?.debug('enumerate');
        try {
            return this.success(this.getDescriptors());
        } catch (error) {
            this.logger?.error('enumerate error', error);

            return this.unknownError(error, []);
        }
    }

    private getDescriptors() {
        const connectedDeviceIds = bluetoothManager.getConnectedDeviceIds();
        const descriptors: DescriptorApiLevel[] = connectedDeviceIds.map(deviceId => ({
            path: deviceId as PathInternal,
            type: DEVICE_TYPE.TypeBluetooth,
            id: deviceId,
        }));

        return descriptors;
    }

    public listen() {
        this.logger?.debug('listen', 'method not implemented');
    }

    public async read(
        path: string,
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        Buffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.ABORTED_BY_TIMEOUT
    > {
        this.logger?.debug('read');

        if (!bluetoothManager.isDeviceConnected(path)) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const result = await bluetoothManager.read(path, signal);
            if (!result.success) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return result;
        } catch (error) {
            this.logger?.error('read error', error);

            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: error.message });
        }
    }

    public async write(path: string, buffer: Buffer) {
        this.logger?.debug('write', buffer);

        if (!bluetoothManager.isDeviceConnected(path)) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const chunk = Buffer.alloc(this.chunkSize);
            buffer.copy(chunk);

            await bluetoothManager.write(path, chunk);

            return this.success(undefined);
        } catch (error) {
            this.logger?.error('write error', error);

            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: error.message });
        }
    }

    public async openDevice(path: string, _first: boolean) {
        this.logger?.debug('openDevice', path);

        // BT does not need to be opened, it is opened when connected
        return this.success(undefined);
    }

    public async closeDevice(path: string) {
        this.logger?.debug('closeDevice', path);
        bluetoothManager.cancelRead(path);

        return this.success(undefined);
    }

    public async dispose(): Promise<void> {
        this.logger?.debug('dispose');
        // Clean up any resources or listeners here
        this.subscription?.remove();
    }
}
