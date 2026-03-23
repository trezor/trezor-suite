import { type Subscription } from 'react-native-ble-plx';

import {
    AbstractApi,
    type AbstractApiConstructorParams,
    type OpenDeviceChannel,
} from '@trezor/transport/src/api/abstract';
import { DEVICE_TYPE } from '@trezor/transport/src/constants';
import * as ERRORS from '@trezor/transport/src/errors';
import {
    type AsyncResultWithTypedError,
    type DescriptorApiLevel,
    type PathInternal,
} from '@trezor/transport/src/types';

import { bluetoothManager } from './bluetoothManager';

/* eslint-disable require-await */
export class BluetoothApi extends AbstractApi {
    chunkSize = 244;

    private subscriptions: Subscription[];
    private pushNotificationSubscribedDevices = new Set<string>();
    private batteryLevelChangeSubscribedDevices = new Set<string>();

    constructor(params: Omit<AbstractApiConstructorParams, 'type'>) {
        super({ ...params, type: 'bluetooth' });
        this.subscriptions = [
            bluetoothManager.onDeviceConnectionStatusChange(event => {
                this.logger?.debug('onDeviceConnectionStatusChange', event);
                this.emit('transport-interface-change', this.getDescriptors());
            }),
            bluetoothManager.onDevicePushNotification(({ deviceId, data }) => {
                this.logger?.debug('onDevicePushNotificationEvent', { deviceId, data });
                if (this.pushNotificationSubscribedDevices.has(deviceId)) {
                    this.emit('trezor-push-notification', { id: deviceId, data });
                }
            }),
            bluetoothManager.onDeviceBatteryLevelChange(({ deviceId, data }) => {
                this.logger?.debug('onDeviceBatteryLevelChange', { deviceId, data });
                if (this.batteryLevelChangeSubscribedDevices.has(deviceId)) {
                    this.emit('battery-level', { id: deviceId, data });
                }
            }),
        ];
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
            apiType: this.type,
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

    public async openDevice(path: string, options?: { channel?: OpenDeviceChannel }) {
        this.logger?.debug('openDevice', path, options);

        if (options?.channel === 'trezor-push-notification') {
            this.pushNotificationSubscribedDevices.add(path);
        } else if (options?.channel === 'battery-level') {
            this.batteryLevelChangeSubscribedDevices.add(path);
        }

        // BT does not need to be opened, it is opened when connected
        return this.success(undefined);
    }

    public async closeDevice(path: string, options?: { channel?: OpenDeviceChannel }) {
        this.logger?.debug('closeDevice', path, options);

        if (options?.channel === 'read') {
            bluetoothManager.cancelRead(path);
        } else if (options?.channel === 'trezor-push-notification') {
            this.pushNotificationSubscribedDevices.delete(path);
        } else if (options?.channel === 'battery-level') {
            this.batteryLevelChangeSubscribedDevices.delete(path);
        }

        return this.success(undefined);
    }

    public async dispose(): Promise<void> {
        this.logger?.debug('dispose');
        this.subscriptions.forEach(s => s.remove());
    }
}
