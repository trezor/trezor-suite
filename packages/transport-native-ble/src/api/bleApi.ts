/* eslint-disable require-await */
import { Device as BleDevice } from 'react-native-ble-plx';

import {
    AbstractApi,
    AbstractApiConstructorParams,
    DEVICE_TYPE,
} from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import { AsyncResultWithTypedError } from '@trezor/transport/src/types';

import { nativeBleManager } from './nativeBleManager';

interface ConstructorParams extends AbstractApiConstructorParams {}

const DEBUG_LOGS = true;

const debugLog = (...args: any[]) => {
    if (DEBUG_LOGS) {
        // eslint-disable-next-line no-console
        console.log('BleApi: ', ...args);
    }
};

export class BleApi extends AbstractApi {
    chunkSize = 244;
    devices: BleDevice[] = [];

    constructor({ logger }: ConstructorParams) {
        super({ logger });

        nativeBleManager.onconnect = async device => {
            debugLog('onconnect', device.id);
            const devicesDescriptors = await this.devicesToDescriptors();

            this.emit('transport-interface-change', devicesDescriptors);
        };

        nativeBleManager.ondisconnect = async device => {
            debugLog('ondisconnect', device.id);
            this.emit('transport-interface-change', await this.devicesToDescriptors());
        };
    }

    public async enumerate() {
        debugLog('Transport enumeration');
        try {
            return this.success(await this.devicesToDescriptors());
        } catch (err) {
            debugLog('Enumerate error', err);

            return this.unknownError(err, []);
        }
    }

    private async devicesToDescriptors() {
        const devices = await nativeBleManager.getAllConnectedDevices();

        // TODO: implement proper device type
        return devices.map(d => ({ path: d.id, type: DEVICE_TYPE.TypeT2 }));
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
