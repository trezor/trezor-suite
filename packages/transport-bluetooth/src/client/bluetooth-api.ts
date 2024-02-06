import { AbstractApi, DEVICE_TYPE } from '@trezor/transport/src/api/abstract';
import { AsyncResultWithTypedError, ResultWithTypedError } from '@trezor/transport/src/types';
import * as ERRORS from '@trezor/transport/src/errors';
import { createDeferred, Deferred } from '@trezor/utils';

import { TrezorBle } from './trezor-ble';
import { BluetoothDevice } from './types';

// @trezor/transport/src/api

export class BluetoothApi extends AbstractApi {
    chunkSize = 244;
    api = new TrezorBle({});
    readDataBuffer: Record<string, number[][]> = {}; // TODO: Record<string, ArrayBuffer[]>
    readRequests: Record<string, Deferred<number[]>> = {};
    recentChunk: Record<string, number[]> = {};

    private devicesToDescriptors(devices: BluetoothDevice[]) {
        return devices.map(d => ({
            path: d.uuid,
            type: DEVICE_TYPE.TypeT2,
            product: 12345, // TODO
        }));
    }

    async init(): AsyncResultWithTypedError<boolean, 'foo'> {
        const { api } = this;
        await api.connect();

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('transport-interface-change', this.devicesToDescriptors(devices));
        };
        // api.on('DeviceDiscovered', transportApiEvent); // TODO: auto-reconnect
        api.on('DeviceConnected', transportApiEvent);
        api.on('DeviceDisconnected', () => transportApiEvent({ devices: [] })); // TODO: this.devices
        api.on('DeviceRead', ({ device, data }) => {
            if (this.readRequests[device.uuid]) {
                // message received AFTER read request, resolve pending response
                this.readRequests[device.uuid].resolve(data);
                delete this.readRequests[device.uuid];
            } else {
                // message received BEFORE read request, put chunk into buffer and wait for read request
                this.readDataBuffer[device.uuid]?.push(data);
            }
        });

        api.on('AdapterStateChanged', ({ powered }) => {
            console.warn('--->AdapterStateChanged in transport', powered);
            if (!powered) {
                transportApiEvent({ devices: [] });
            }
        });

        await api.sendMessage('start_scan');

        return this.success(true);
    }

    enumerate() {
        return Promise.resolve(this.success(this.devicesToDescriptors(this.api.getDevices())));
    }

    listen(): void {
        throw new Error('Method not implemented.');
    }
    dispose(): void {
        throw new Error('Method not implemented.');
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

    public read(path: string, _signal?: AbortSignal) {
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
