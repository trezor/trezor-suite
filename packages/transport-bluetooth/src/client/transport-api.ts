import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { AsyncResultWithTypedError, ResultWithTypedError } from '@trezor/transport/src/types';
import * as ERRORS from '@trezor/transport/src/errors';
import { createDeferred, Deferred } from '@trezor/utils';

import { TrezorBleApi } from './trezor-ble-api';
import { BluetoothDevice } from './types';

export class BluetoothApi extends AbstractApi {
    api = new TrezorBleApi({});
    readDataBuffer: Record<string, number[][]> = {}; // TODO: Record<string, ArrayBuffer[]>
    readRequests: Record<string, Deferred<number[]>> = {};
    recentChunk: Record<string, number[]> = {};

    async init(): AsyncResultWithTypedError<boolean, 'foo'> {
        const { api } = this;
        await api.connect();

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit(
                'transport-interface-change',
                devices.filter(d => d.connected).map(d => d.uuid),
            );
        };
        api.on('DeviceDiscovered', transportApiEvent);
        api.on('DeviceConnected', transportApiEvent);
        api.on('DeviceDisconnected', transportApiEvent);
        api.on('DeviceRead', ({ device, data }) => {
            if (this.readRequests[device.uuid]) {
                // message received AFTER read request, resolve pending response
                this.readRequests[device.uuid].resolve(data);
            } else {
                // message received BEFORE read request, put chunk into buffer and wait for read request
                this.readDataBuffer[device.uuid]?.push(data);
            }
        });

        await api.sendMessage('start_scan');

        return this.success(true);
    }

    enumerate(): AsyncResultWithTypedError<
        string[],
        'unexpected error' | 'Aborted by timeout' | 'Aborted by signal'
    > {
        return Promise.resolve(this.success(this.api.getDevices().map(d => d.uuid)));
    }

    // async read_thru_Ws(
    //     path: string,
    // ): AsyncResultWithTypedError<
    //     ArrayBuffer,
    //     | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
    //     | typeof ERRORS.UNEXPECTED_ERROR
    //     | typeof ERRORS.ABORTED_BY_TIMEOUT
    //     | 'device not found'
    //     | 'Unable to open device'
    //     | 'A transfer error has occurred.'
    // > {
    //     // return this.api.sendMessage('read', path);
    //     // await new Promise(resolve => setTimeout(resolve, 1000));
    //     const result = await this.api.sendMessage('read', path);
    //     const x = Buffer.compare(Buffer.from(result), Buffer.from(this.prevData));
    //     if (x === 0 || result.length === 0) {
    //         console.warn('--> is the same!!!!', result);
    //         if (result.length === 0) {
    //             await new Promise(resolve => setTimeout(resolve, 1000));
    //         }
    //         return this.read(path);
    //     }
    //     this.prevData = result;
    //     console.warn('Device read', result, Buffer.from(result));
    //     return this.success(Buffer.from(result));
    // }

    // async read01(
    //     path: string,
    // ): AsyncResultWithTypedError<
    //     ArrayBuffer,
    //     | 'device disconnected during action'
    //     | typeof ERRORS.UNEXPECTED_ERROR
    //     | typeof ERRORS.ABORTED_BY_TIMEOUT
    //     | 'device not found'
    //     | 'Unable to open device'
    //     | 'A transfer error has occurred.'
    // > {
    //     console.warn('---reading from the buffer');
    //     // return this.api.sendMessage('read', path);
    //     // await new Promise(resolve => setTimeout(resolve, 1000));
    //     const result = this.readDataBuffer[path].shift() || [];
    //     console.warn('---data from the buffer', result);
    //     const x = Buffer.compare(Buffer.from(result), Buffer.from(this.prevData));
    //     if (x === 0 || result.length === 0) {
    //         console.warn('--> is the same!!!!', result);
    //         if (result.length === 0) {
    //             await new Promise(resolve => setTimeout(resolve, 1000));
    //         }
    //         return this.read(path);
    //     }
    //     this.prevData = result;
    //     console.warn('Device read', result, Buffer.from(result));
    //     return this.success(Buffer.from(result));
    // }

    public read(
        path: string,
    ): AsyncResultWithTypedError<
        ArrayBuffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
    > {
        return new Promise<ResultWithTypedError<ArrayBuffer, typeof ERRORS.UNEXPECTED_ERROR>>(
            resolve => {
                // TODO: chunk duplicates will be resolved by protocol-v2
                const bufferMessage = this.readDataBuffer[path]?.shift() || [];
                if (bufferMessage.length > 0) {
                    const prevMessage = this.recentChunk[path] || [];
                    const isTheSame = Buffer.compare(
                        Buffer.from(bufferMessage),
                        Buffer.from(prevMessage),
                    );
                    if (isTheSame === 0) {
                        console.warn('--> is the same!!!!', bufferMessage);
                        return new Promise(resolve => setTimeout(resolve, 500)).then(() =>
                            this.read(path),
                        );
                    }

                    this.recentChunk[path] = bufferMessage;
                    return resolve(this.success(Buffer.from(bufferMessage)));
                }

                this.readRequests[path] = createDeferred();
                return this.readRequests[path].promise.then(message => {
                    delete this.readRequests[path];
                    this.recentChunk[path] = message;
                    resolve(this.success(Buffer.from(message)));
                });
            },
        );
    }

    async write(
        path: string,
        buffer: Buffer,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | 'device not found'
        | 'Unable to open device'
        | 'A transfer error has occurred.'
    > {
        console.warn('Device write', buffer);
        const result = await this.api.sendMessage('write', [path, [...buffer]]);
        console.warn('Device write', result);
        return this.success(undefined);

        // return this.api.sendMessage('write', [path, data]);
    }

    async openDevice(
        path: string,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | 'Aborted by signal'
        | 'device not found'
        | 'Unable to open device'
    > {
        this.readDataBuffer[path] = [];
        const result = await this.api.sendMessage('open_device', path);
        console.warn('Device opened', result);
        return this.success(undefined);
    }

    async closeDevice(
        path: string,
    ): AsyncResultWithTypedError<
        undefined,
        'unexpected error' | 'device not found' | 'Unable to close device'
    > {
        delete this.readDataBuffer[path];
        delete this.recentChunk[path];
        const result = await this.api.sendMessage('close_device', path);
        console.warn('Device closed', result);
        return this.success(undefined);
    }
}
