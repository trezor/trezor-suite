import {
    AbstractApi,
    AbstractApiAwaitedResult,
    DEVICE_TYPE,
} from '@trezor/transport/src/api/abstract';
import { PathInternal } from '@trezor/transport/src/types';
import { createDeferred, Deferred } from '@trezor/utils';

import { TrezorBle } from './trezor-ble';
import { BluetoothDevice } from './types';

// Reflection of @trezor/transport/src/api

export class BluetoothApi extends AbstractApi {
    chunkSize = 244;
    api = new TrezorBle({});
    readDataBuffer: Record<string, number[][]> = {}; // TODO: Record<string, ArrayBuffer[]>
    readRequests: Record<string, Deferred<number[]>> = {};
    recentChunk: Record<string, number[]> = {};

    private devicesToDescriptors(devices: BluetoothDevice[]) {
        return devices
            .filter(d => d.connected && d.paired)
            .map(d => ({
                path: d.uuid as PathInternal,
                type: DEVICE_TYPE.TypeBluetooth,
                uuid: d.uuid,
            }));
    }

    async init() {
        const { api } = this;
        await api.connect();

        const transportApiEvent = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('transport-interface-change', this.devicesToDescriptors(devices));
        };
        // api.on('device_discovered', transportApiEvent); // TODO: auto-reconnect
        api.on('device_connected', transportApiEvent);
        api.on('device_disconnected', () => transportApiEvent({ devices: [] })); // TODO: this.devices
        api.on('device_read', ({ uuid, data }) => {
            console.warn('DeviceRead handled in BT api', data);
            if (this.readRequests[uuid]) {
                // message received AFTER read request, resolve pending response
                this.readRequests[uuid].resolve(data);
                delete this.readRequests[uuid];
            } else {
                // message received BEFORE read request, put chunk into buffer and wait for read request
                this.readDataBuffer[uuid]?.push(data);
            }
        });

        api.on('adapter_state_changed', ({ powered }) => {
            if (!powered) {
                transportApiEvent({ devices: [] });
            }
        });

        // TODO: sanc and use DeviceDiscovered only if there are known devices
        // await api.sendMessage('start_scan');

        return this.success(true);
    }

    enumerate() {
        return Promise.resolve(this.success(this.devicesToDescriptors(this.api.getDevices())));
    }

    listen() {
        console.warn('BluetoothApi listen method not implemented.');
    }

    dispose() {
        this.api.disconnect();
        console.warn('BluetoothApi dispose method not implemented.');
    }

    public read(path: string, _signal?: AbortSignal) {
        return new Promise<AbstractApiAwaitedResult<'read'>>(resolve => {
            // TODO: chunk duplicates will be resolved by protocol-v2 (thp)
            const bufferMessage = this.readDataBuffer[path]?.shift() || [];
            if (bufferMessage.length > 0) {
                const prevMessage = this.recentChunk[path] || [];
                const isTheSame = Buffer.compare(
                    Buffer.from(bufferMessage),
                    Buffer.from(prevMessage),
                );
                if (isTheSame === 0) {
                    console.warn('--> is the same!!!!', bufferMessage, this.readDataBuffer);

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
        });
    }

    async write(path: string, buffer: Buffer) {
        console.warn('Device write', buffer);
        const result = await this.api.sendMessage('write', [path, Array.from(buffer)]);
        console.warn('Device write', result);

        return this.success(undefined);
    }

    async openDevice(path: string) {
        this.readDataBuffer[path] = [];
        const result = await this.api.sendMessage('open_device', path);
        console.warn('Device opened', result);

        return this.success(undefined);
    }

    async closeDevice(path: string) {
        delete this.readDataBuffer[path];
        delete this.recentChunk[path];
        const result = await this.api.sendMessage('close_device', path);
        console.warn('Device closed', result);

        return this.success(undefined);
    }
}
