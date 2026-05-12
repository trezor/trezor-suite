import { type Subscription } from 'react-native-ble-plx';

import {
    AbstractApi,
    type AbstractApiArgs,
    type AbstractApiConstructorParams,
    DEVICE_TYPE,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    type PathInternal,
    error,
    success,
} from '@trezor/transport-common';

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
            return success(this.getDescriptors());
        } catch (err) {
            this.logger?.error('enumerate error', err);

            return this.unknownError(err, []);
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

    public async read(...[path, options]: AbstractApiArgs<'read'>) {
        this.logger?.debug('read');

        if (!bluetoothManager.isDeviceConnected(path)) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const result = await bluetoothManager.read(path, options?.signal);
            if (!result.success) {
                return error({ code: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return result;
        } catch (err) {
            this.logger?.error('read error', err);

            return error({ code: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async write(...[path, buffer]: AbstractApiArgs<'write'>) {
        this.logger?.debug('write', buffer);

        if (!bluetoothManager.isDeviceConnected(path)) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const chunk = Buffer.alloc(this.chunkSize);
            buffer.copy(chunk);

            await bluetoothManager.write(path, chunk);

            return success(undefined);
        } catch (err) {
            this.logger?.error('write error', err);

            return error({ code: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async openDevice(...[path, options]: AbstractApiArgs<'openDevice'>) {
        this.logger?.debug('openDevice', path, options);

        if (options?.channel === 'trezor-push-notification') {
            this.pushNotificationSubscribedDevices.add(path);
        } else if (options?.channel === 'battery-level') {
            this.batteryLevelChangeSubscribedDevices.add(path);
        }

        // BT does not need to be opened, it is opened when connected
        return success(undefined);
    }

    public async closeDevice(...[path, options]: AbstractApiArgs<'closeDevice'>) {
        this.logger?.debug('closeDevice', path, options);

        if (options?.channel === 'read') {
            bluetoothManager.cancelRead(path);
        } else if (options?.channel === 'trezor-push-notification') {
            this.pushNotificationSubscribedDevices.delete(path);
        } else if (options?.channel === 'battery-level') {
            this.batteryLevelChangeSubscribedDevices.delete(path);
        }

        return success(undefined);
    }

    public async dispose(): Promise<void> {
        this.logger?.debug('dispose');
        this.subscriptions.forEach(s => s.remove());
    }
}
