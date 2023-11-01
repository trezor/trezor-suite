/// <reference types="web-bluetooth" />

import { createDeferred, Deferred, promiseAllSequence } from '@trezor/utils';

import { AbstractApi } from './abstract';
import { AsyncResultWithTypedError, ResultWithTypedError } from '../types';

import * as ERRORS from '../errors';

type ConstructorParams = ConstructorParameters<typeof AbstractApi>[0];

interface ConnectedDevice {
    device: BluetoothDevice;
    writeChannel: BluetoothRemoteGATTCharacteristic;
    readChannel: BluetoothRemoteGATTCharacteristic;
    opened?: boolean;
}

export class WebBluetoothApi extends AbstractApi {
    protected pairedDevices: BluetoothDevice[] = [];
    protected connectedDevices: ConnectedDevice[] = [];
    protected pairing = false;
    protected communicating = false;
    protected scanning = false;
    protected openedDevices: string[] = [];
    unreadableDevices: string[] = [];
    readRequests: Record<string, Deferred<ArrayBuffer>> = {};
    readBuffers: Record<string, ArrayBuffer[]> = {};

    constructor({ logger }: ConstructorParams) {
        super({ logger });
    }

    private isNativeApiAvailable() {
        return typeof navigator !== 'undefined' && typeof navigator.bluetooth !== 'undefined';
    }

    private getBluetoothAvailability() {
        if (this.isNativeApiAvailable()) {
            return navigator.bluetooth.getAvailability();
        }
        return false;
    }

    private findDevice(path: string) {
        return this.connectedDevices.find(({ device }) => device.id === path);
    }

    private removeDevice(path: string) {
        this.connectedDevices = this.connectedDevices.filter(({ device }) => device.id !== path);
    }

    public write(path: string, buffer: Buffer) {
        return new Promise<
            ResultWithTypedError<
                undefined,
                typeof ERRORS.INTERFACE_DATA_TRANSFER | typeof ERRORS.UNEXPECTED_ERROR
            >
        >(resolve => {
            const device = this.findDevice(path);
            if (!device) {
                return resolve(
                    this.error({
                        error: ERRORS.INTERFACE_DATA_TRANSFER,
                        message: 'device not found',
                    }),
                );
            }
            return device.writeChannel
                .writeValue(buffer)
                .then(() => resolve(this.success(undefined)))
                .catch(error =>
                    resolve(
                        this.error({
                            error: ERRORS.INTERFACE_DATA_TRANSFER,
                            message: error.message,
                        }),
                    ),
                );
        });
    }

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
        this.communicating = true;

        return new Promise<
            ResultWithTypedError<
                ArrayBuffer,
                typeof ERRORS.INTERFACE_DATA_TRANSFER | typeof ERRORS.ABORTED_BY_TIMEOUT
            >
        >(resolve => {
            if (this.readBuffers[path]) {
                const message = this.readBuffers[path].shift();
                console.warn('BTE.read resolved from buffers', message);
                if (this.readBuffers[path].length === 0) {
                    delete this.readBuffers[path];
                }
                if (message) {
                    return resolve(this.success(message));
                }
            }

            this.readRequests[path] = createDeferred();
            console.warn('BTE.read wait for event');
            return this.readRequests[path].promise.then(message => {
                delete this.readRequests[path];
                console.warn('BTE.read resolved from promise');
                resolve(this.success(message));
            });
            // this.readInterface
            // const onError = (err: Error) => {
            //     this.logger.error(err.message);

            //     resolve(
            //         this.error({
            //             error: ERRORS.INTERFACE_DATA_TRANSFER,
            //             message: err.message,
            //         }),
            //     );
            //     this.readInterface.removeListener('error', onError);
            //     // eslint-disable-next-line @typescript-eslint/no-use-before-define
            //     this.interface.removeListener('message', onMessage);
            // };
            // const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
            //     if (message.toString() === 'PONGPONG') {
            //         return;
            //     }
            //     this.interface.removeListener('error', onError);
            //     this.interface.removeListener('message', onMessage);
            //     resolve(this.success(message));
            // };
            // this.interface.addListener('error', onError);
            // this.interface.addListener('message', onMessage);
            // console.warn('READ BT', this.notifications);
            // resolve(
            //     this.error({
            //         error: ERRORS.INTERFACE_DATA_TRANSFER,
            //         message: 'Foo bar',
            //     }),
            // );
        }).finally(() => {
            this.communicating = false;
        });
    }

    private async getDeviceChannels(gatt: BluetoothRemoteGATTServer) {
        const [service] = await gatt.getPrimaryServices();
        const characteristics = await service.getCharacteristics();
        let writeChannel: BluetoothRemoteGATTCharacteristic | undefined;
        let readChannel: BluetoothRemoteGATTCharacteristic | undefined;
        characteristics.forEach(ch => {
            if (ch.properties.write) {
                writeChannel = ch;
            } else if (ch.properties.notify) {
                readChannel = ch;
            }
        });
        if (!writeChannel || !readChannel) {
            throw new Error('missing characteristics');
        }
        return {
            writeChannel,
            readChannel,
        };
    }

    private async isDeviceConnected(device: BluetoothDevice) {
        // if (!device.gatt || !device.gatt.connected) return;
        if (!device.gatt) return;
        if (device.gatt.connected) {
            const connectedDevice = this.findDevice(device.id);
            if (connectedDevice) {
                return connectedDevice;
            }
        }

        if (this.unreadableDevices.includes(device.id)) {
            console.warn('Dealing with unreadable device');
            if (!device.gatt.connected) {
                // crashes whole app if connected
                try {
                    await device.forget();
                } catch (error) {
                    console.warn('---reset device error', error);
                }
            } else {
                // this crashes whole app
                // try {
                //     device.gatt.disconnect();
                // } catch (error) {
                //     console.warn('---disconnect device error', error);
                // }
            }
            return;
        }

        try {
            const server = await device.gatt.connect();
            device.ongattserverdisconnected = () => {
                console.warn('device.ongattserverdisconnected', device);
                this.removeDevice(device.id);
            };
            const channels = await this.getDeviceChannels(server);
            // try to read something, device might be in pairing (PIN) mode.
            // obsolete once pairing with PIN will be removed?
            await channels.readChannel.readValue();

            console.warn('connected successfully');

            return {
                device,
                ...channels,
            };
        } catch (error) {
            // - `GATT operation already in progress` - probably in PIN mode
            // - `GATT Error Unknown` - after multiple error above. probably paring failed
            if (error.message.includes('Device is no longer in range')) {
                console.warn('---reset device');
                this.unreadableDevices.push(device.id);
                // if (device.gatt.connected) {
                //     device.gatt.disconnect();
                // }
                // await device.forget().catch(e => {
                //     console.warn('---reset device error', e);
                // });
            }
            // silent
            console.warn('isDeviceConnected error', error, device);
        }
    }

    public async enumerate() {
        if (!(await this.getBluetoothAvailability())) {
            return this.success([]);
        }

        const pairedDevices = await navigator.bluetooth.getDevices();
        const connectedDevices = await promiseAllSequence(
            pairedDevices.map(device => () => this.isDeviceConnected(device)),
        );

        this.connectedDevices = [];
        connectedDevices.forEach(device => {
            if (device) this.connectedDevices.push(device);
        });

        console.warn('Enumerate', pairedDevices, connectedDevices);

        return this.success(this.connectedDevices.map(({ device }) => device.id));

        // console.warn('BLE enumerate', devices);
        // if (devices.length > 0 && !this.device) {
        //     const [device] = devices;

        //     const server = await device.gatt?.connect();
        //     const services = await server?.getPrimaryServices();
        //     if (services) {
        //         const ch = await services[0].getCharacteristics();
        //         if (ch) {
        //             const [write, notify] = ch;
        //             this.writeInterface = write;
        //             this.readInterface = notify;
        //             notify.startNotifications();
        //             notify.addEventListener('characteristicvaluechanged', e => {
        //                 console.warn('NOTIFYYY', e, notify.value?.buffer);
        //                 // @ts-expect-erro
        //                 // const [buffer] = e.target!.value;
        //                 // this.notifications.push(notify.value?.buffer);
        //                 if (this.readDeferred) {
        //                     this.readDeferred.resolve(notify.value?.buffer);
        //                 }
        //             });
        //         }
        //     }
        //     this.device = device;
        // }

        // const enumerateResult = devices.map(device => device.id);

        // return this.success(enumerateResult);
    }

    handleReadChannel(_event: Event) {
        // event.currentTarget.value
    }

    public openDevice(path: string, _first: boolean) {
        const connectedDevice = this.findDevice(path);
        if (!connectedDevice) return Promise.resolve(this.success(undefined));
        if (connectedDevice.opened)
            return Promise.resolve(this.error({ error: ERRORS.UNEXPECTED_ERROR }));
        // return Promise.resolve(
        //     this.error({
        //         error: ERRORS.INTERFACE_DATA_TRANSFER,
        //         message: 'device not found',
        //     }),
        // );

        console.warn('Opening device', connectedDevice);

        const { device, readChannel } = connectedDevice;
        readChannel.startNotifications();
        readChannel.oncharacteristicvaluechanged = () => {
            const chunk = readChannel.value?.buffer;
            if (!chunk) return;
            if (this.readRequests[device.id]) {
                // message received AFTER read request, resolve pending response
                this.readRequests[device.id].resolve(chunk);
                console.warn('BTE.characteristicvaluechanged resolved-from-promise');
            } else {
                // message received BEFORE read request, put chunk into buffer and wait for read request
                if (!this.readBuffers[device.id]) {
                    this.readBuffers[device.id] = [];
                }
                this.readBuffers[device.id].push(chunk);
                console.warn('BTE.characteristicvaluechanged added-to-buffer');
            }
        };

        connectedDevice.opened = true;

        return Promise.resolve(this.success(undefined));
    }

    public closeDevice(path: string) {
        const device = this.findDevice(path);
        device!.opened = false;
        // device?.readChannel.oncharacteristicvaluechanged = undefined;
        device?.readChannel.stopNotifications();

        return Promise.resolve(this.success(undefined));
    }

    // custom
    public init() {
        if (!this.isNativeApiAvailable()) {
            return this.error({
                error: 'unexpected error',
                message: 'navigator.bluetooth api not found',
            });
        }
        return this.success(undefined);
    }

    public startScanning() {
        if (this.scanning) return;
        this.scanning = true;
    }

    public stopScanning() {}
}
