import { TypedEmitter } from '@trezor/utils';

import { TrezorBluetooth } from './trezor-bluetooth';
import type {
    BluetoothAdapterState,
    BluetoothDevice,
    BluetoothIpcApi,
    BluetoothIpcEvents,
    BluetoothIpcState,
    TrezorBluetoothSettings,
} from './types';

/*
 * used in @trezor/suite-desktop-core main context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    private api: TrezorBluetooth;
    private state: BluetoothIpcState = { knownDevices: [] };

    constructor(settings: TrezorBluetoothSettings) {
        super();
        this.api = new TrezorBluetooth(settings);
    }

    private async initApi() {
        if (this.api.isConnected()) return;

        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const connectableDevices = (devs: BluetoothDevice[]) =>
            devs
                .filter(
                    d =>
                        this.state.knownDevices.find(dev => d.macAddress === dev.macAddress) ||
                        d.paired ||
                        (d.data && d.data[0] === 1),
                )
                .map(d => {
                    // TODO: paired device on linux adv. data missing
                    if (d.paired && d.data.length === 0) {
                        d.data.push(1, 1, 1);
                    }

                    return d;
                });

        const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', connectableDevices(devices));
        };

        const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
            this.emit('adapter-event', state);
            if (state === 'enabled') {
                this.api.send('start_scan').catch(error => {
                    console.warn('Start scan error', error);
                });
            } else {
                // api.send('stop_scan');
            }
        };

        this.api.on('device_discovered', emitListUpdate);
        this.api.on('device_updated', emitListUpdate);
        this.api.on('device_connected', emitListUpdate);
        this.api.on('device_disconnected', emitListUpdate);
        this.api.on('adapter_state_changed', emitAdapterState);
        this.api.on('device_updated', ({ id, devices }) => {
            const device = devices.find(d => (d.id = id));
            if (device) {
                this.emit('device-update', device);
            }
        });

        return { success: true };
    }

    async init(state?: BluetoothIpcState) {
        if (state) {
            this.state = { knownDevices: state.knownDevices };
        }

        if (this.state.knownDevices.length > 0) {
            try {
                await this.initApi();
                const scanResult = await this.api.send('start_scan');
                if (scanResult.length === 0) {
                    // wait some time if devices are not returned immediately
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                const enumerateResult = await this.api.send('enumerate');

                const promises = enumerateResult.flatMap(d => {
                    // device is already connected to BT (linux only?)
                    if (d.connected) {
                        return this.api.send('connect_device', [d.id, 5000]);
                    }
                    const isKnown = this.state.knownDevices.find(
                        dd => dd.macAddress === d.macAddress,
                    );
                    if (isKnown) {
                        return this.api.send('connect_device', [d.id, 5000]);
                    }

                    return [];
                });

                // start auto reconnection
                Promise.all(promises)
                    .catch(e => {
                        // silent error
                        console.warn('TODO: initial connection error', e);
                    })
                    .finally(() => {
                        // this.api.off('device_connection_status', emitDeviceUpdate);
                        // this.api.off('device_updated', emitListUpdate);
                        // this.api.off('device_connected', emitListUpdate);
                    });
            } catch (e) {
                console.warn('initial scan error', e);
            }
        }

        return Promise.resolve({ success: true, payload: true } as const);
    }

    dispose() {
        return Promise.resolve({ success: true, payload: true } as const);
    }

    async startScan() {
        try {
            await this.initApi();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const connectableDevices = (devs: BluetoothDevice[]) =>
            devs
                .filter(
                    d =>
                        this.state.knownDevices.find(dev => d.macAddress === dev.macAddress) ||
                        d.paired ||
                        (d.data && d.data[0] === 1),
                )
                .map(d => {
                    // TODO: paired device on linux adv. data missing
                    if (d.paired && d.data.length === 0) {
                        d.data.push(1, 1, 1);
                    }

                    return d;
                });
        // return devs.filter(d => d.data.length > 0 && (d.paired || d.data[0] === 1));
        // const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
        //     this.emit('device-list-update', connectableDevices(devices));
        // };
        // const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
        //     this.emit('adapter-event', state);
        //     if (state === 'enabled') {
        //         this.api.send('start_scan').catch(error => {
        //             console.warn('Start scan error', error);
        //         });
        //     } else {
        //         // api.send('stop_scan');
        //     }
        // };

        // this.api.on('device_discovered', emitListUpdate);
        // this.api.on('device_updated', emitListUpdate);
        // this.api.on('device_updated', ({ id, devices }) => {
        //     const d = devices.find(dd => (dd.id = id));
        //     if (d) {
        //         this.emit('device-update', d);
        //     }
        // });
        // this.api.on('device_discovered', p => {
        //     console.warn('DEV DISCOVERED!', p);
        // });

        // this.api.on('device_updated', emitListUpdate);
        // this.api.on('device_connected', emitListUpdate);
        // this.api.on('device_disconnected', emitListUpdate);
        // this.api.on('adapter_state_changed', emitAdapterState);

        try {
            await this.api.send('get_info');
            // emit adapter event
            // if (!info.state) {
            //     this.emit('adapter-event', 'disabled');
            // }

            const devices = await this.api.send('start_scan');
            this.emit('device-list-update', connectableDevices(devices));
        } catch (error) {
            return { success: false, error: error.message };
        }

        return { success: true } as const;
    }

    async stopScan() {
        try {
            await this.initApi();
            if (this.state.knownDevices.length === 0) {
                await this.api.send('stop_scan');
            }

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            // TODO: this is wrong, should not disconnect should only clear listeners set by startScan
            // this.api.removeAllListeners();
            // this.api.disconnect();
        }
    }

    async connectDevice(id: string) {
        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const emitDeviceUpdate = (event: BluetoothDevice) => this.emit('device-update', event);

        this.api.on('device_connection_status', emitDeviceUpdate);

        const result = await this.api
            .send('connect_device', [id, 30000])
            .then(() => ({ success: true }) as const)
            .catch(error => ({ success: false, error: error.message }));

        this.api.off('device_connection_status', emitDeviceUpdate);

        return result;
    }

    async disconnectDevice(id: string) {
        try {
            await this.api.connect();
            await this.api.send('disconnect_device', id);

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async forgetDevice(id: string) {
        try {
            await this.api.connect();
            await this.api.send('forget_device', id);

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
