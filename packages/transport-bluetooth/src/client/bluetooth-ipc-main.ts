import { TypedEmitter, resolveAfter } from '@trezor/utils';

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
    private isScanning = false;

    constructor(settings: TrezorBluetoothSettings) {
        super();
        this.api = new TrezorBluetooth(settings);
    }

    // 1. suite knows the device but system doest have to know it. could be removed manually from system UI
    // 2. system knows the device (boolean on linux and windows, unknown on macos)
    // 3. the device is in pairing mode
    private filterConnectableDevices(devices: BluetoothDevice[]) {
        return devices.filter(
            d =>
                this.state.knownDevices.find(dev => d.macAddress === dev.macAddress) ||
                d.paired ||
                d.data[0], // defined and greater than 0
        );
    }

    private async connectApi() {
        if (this.api.isConnected()) return;

        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        };

        const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
            this.emit('adapter-event', state);
            if (state === 'enabled' && this.isScanning) {
                this.api.send('start_scan').catch(error => {
                    console.warn('Start scan error', error);
                });
            }
        };

        this.api.on('device_discovered', emitListUpdate);
        this.api.on('device_updated', emitListUpdate);
        this.api.on('device_connected', emitListUpdate);
        this.api.on('device_disconnected', emitListUpdate);
        this.api.on('adapter_state_changed', emitAdapterState);
        this.api.on('device_updated', ({ id, devices }) => {
            const device = this.filterConnectableDevices(devices).find(d => (d.id = id));
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
                await this.connectApi();
                await this.api.send('set_state', {
                    devices: this.state.knownDevices,
                });
                await this.api.send('get_info');

                const scanResult = await this.api.send('start_scan');
                if (scanResult.length === 0) {
                    // wait some time if devices are not returned immediately
                    await resolveAfter(1000);
                }
                await this.api.send('enumerate');
            } catch (e) {
                console.warn('initial scan error', e);
            }
        }

        return { success: true } as const;
    }

    dispose() {
        return Promise.resolve({ success: true } as const);
    }

    async startScan() {
        try {
            await this.connectApi();
        } catch (error) {
            return { success: false, error: error.message };
        }

        try {
            const devices = await this.api.send('start_scan');
            this.isScanning = true;
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        } catch (error) {
            return { success: false, error: error.message };
        }

        return { success: true } as const;
    }

    async stopScan() {
        try {
            await this.connectApi();
            if (this.state.knownDevices.length === 0) {
                this.isScanning = false;
                await this.api.send('stop_scan');
            }

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async connectDevice(id: string) {
        try {
            await this.connectApi();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const emitDeviceUpdate = (device: BluetoothDevice) => this.emit('device-update', device);

        this.api.on('device_connection_status', emitDeviceUpdate);

        const result = await this.api
            .send('connect_device', { id, timeout: 50000 })
            .then(() => ({ success: true }) as const)
            .catch(error => ({ success: false, error: error.message }));

        this.api.off('device_connection_status', emitDeviceUpdate);

        return result;
    }

    async disconnectDevice(id: string) {
        try {
            await this.connectApi();
            await this.api.send('disconnect_device', id);

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async forgetDevice(id: string) {
        try {
            await this.connectApi();
            await this.api.send('forget_device', id);

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
