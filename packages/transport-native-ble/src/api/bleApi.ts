/* eslint-disable require-await */
import { Device } from 'react-native-ble-plx';

import {
    AbstractApi,
    AbstractApiConstructorParams,
    DEVICE_TYPE,
} from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import { AsyncResultWithTypedError } from '@trezor/transport/src/types';

import { nativeBleManager } from './nativeBleManager';

interface ConstructorParams extends AbstractApiConstructorParams {}

interface TransportInterfaceDevice {
    session?: null | string;
    path: string;
    device: USBDevice;
}

const DEBUG_LOGS = true;

const debugLog = (...args: any[]) => {
    if (DEBUG_LOGS) {
        // eslint-disable-next-line no-console
        console.log('BleApi: ', ...args);
    }
};

export class BleApi extends AbstractApi {
    chunkSize = 244;
    devices: TransportInterfaceDevice[] = [];

    constructor({ logger }: ConstructorParams) {
        super({ logger });

        nativeBleManager.onconnect = device => {
            debugLog('onconnect', device.id);
            this.devices = [...this.devices, ...this.createDevices([device])];

            this.emit('transport-interface-change', this.devicesToDescriptors());
        };

        nativeBleManager.ondisconnect = device => {
            const index = this.devices.findIndex(d => d.path === device.id);
            if (index > -1) {
                this.devices.splice(index, 1);
                this.emit('transport-interface-change', this.devicesToDescriptors());
            } else {
                this.emit('transport-interface-error', ERRORS.DEVICE_NOT_FOUND);
                this.logger.error('device that should be removed does not exist in state');
            }
        };
    }

    private createDevices(devices: Device[]): TransportInterfaceDevice[] {
        return devices.map(device => ({
            path: device.id,
            device: {
                usbVersionMajor: 1,
                usbVersionMinor: 1,
                usbVersionSubminor: 1,
                deviceClass: 0,
                deviceSubclass: 0,
                deviceProtocol: 0,
                vendorId: 1234,
                productId: 1234,
                deviceVersionMajor: 1,
                deviceVersionMinor: 0,
                deviceVersionSubminor: 0,
                manufacturerName: 'Trezor',
                productName: 'Trezor Device',
                serialNumber: 'serialNumber',
                configuration: undefined,
                configurations: [],
                opened: true,
                open: async () => {},
                close: () => {},
                forget: async () => {},
            } as any,
        }));
    }

    public async enumerate() {
        debugLog('Transport enumeration');
        try {
            // const devices = await nativeBleManager.getAllConnectedDevices();

            this.devices = this.createDevices([]);

            return this.success(this.devicesToDescriptors());
        } catch (err) {
            debugLog('Enumerate error', err);

            // this shouldn't throw
            return this.unknownError(err, []);
        }
    }

    private devicesToDescriptors() {
        return this.devices.map(d => ({ path: d.path, type: DEVICE_TYPE.TypeT2 }));
    }

    public async read(
        path: string,
    ): AsyncResultWithTypedError<
        ArrayBuffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
    > {
        debugLog('read');
        const device = nativeBleManager.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const res = await nativeBleManager.read(path);

            if (!res) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            // convert base64 string to ArrayBuffer
            const data = Buffer.from(res, 'base64');

            return this.success(data);
        } catch (err) {
            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async write(path: string, buffer: Buffer) {
        debugLog('write', buffer);
        const device = nativeBleManager.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }
        try {
            const base64Chunk = buffer.toString('base64');
            await nativeBleManager.write(path, base64Chunk);

            return this.success(undefined);
        } catch (err) {
            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async openDevice(_path: string, _first: boolean) {
        // BT does not need to be opened, it opened when connected
        return this.success(undefined);
    }

    public async openInternal(_path: string, _first: boolean) {
        return this.success(undefined);
    }

    public async closeDevice(_path: string) {
        // BT does not need to be closed, it closed when disconnected

        return this.success(undefined);
    }
}
