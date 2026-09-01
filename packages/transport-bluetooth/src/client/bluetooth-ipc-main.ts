import { TypedEmitter, resolveAfter } from '@trezor/utils';

import { TrezorBluetooth } from './trezor-bluetooth';
import type {
    BluetoothAdapterState,
    BluetoothDevice,
    BluetoothIpcApi,
    BluetoothIpcEvents,
    BluetoothIpcState,
    IpcResponse,
    ScanOwner,
    TrezorBluetoothSettings,
} from './types';

/*
 * used in @trezor/suite-desktop-core nodejs (main) context
 * unavailable in browser (renderer) context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    private api: TrezorBluetooth;
    private state: BluetoothIpcState = { knownDevices: [] };
    private isScanning = false;
    private scanOwners = new Set<ScanOwner>();

    constructor(settings: TrezorBluetoothSettings) {
        super();
        this.api = new TrezorBluetooth(settings);
    }

    // 1. suite knows the device but system may not. device could be removed manually from the system UI
    // 2. system knows the device (boolean on linux and windows, unknown on macos)
    // 3. device is in pairing mode (data[0] > 0)
    private filterConnectableDevices(devices: BluetoothDevice[]) {
        return devices.filter(
            d =>
                this.state.knownDevices.find(dev => d.macAddress === dev.macAddress) ||
                d.paired ||
                d.data[0],
        );
    }

    private result(error?: string): IpcResponse {
        return error ? { success: false, error } : { success: true };
    }

    private async connectApi() {
        if (this.api.isConnected()) return;

        try {
            await this.api.connect();
        } catch (error) {
            return this.result(error.message);
        }

        const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        };

        const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
            this.emit('adapter-event', state);
            if (state === 'enabled' && this.isScanning) {
                // auto restart scan if adapter becomes enabled
                this.api.send('start_scan').catch(error => {
                    console.warn('Auto start_scan error', error);
                });
            }
        };

        this.api.on('device_discovered', emitListUpdate);
        this.api.on('device_connected', emitListUpdate);
        this.api.on('device_disconnected', emitListUpdate);
        this.api.on('adapter_state_changed', emitAdapterState);
        this.api.on('device_updated', ({ id, devices }) => {
            emitListUpdate({ devices });
            const device = this.filterConnectableDevices(devices).find(d => d.id === id);
            if (device) {
                this.emit('device-update', device);
            }
        });

        this.api.on('open_bluetooth_settings', event => {
            this.emit('open-bluetooth-settings', event);
        });

        return this.result();
    }

    async init(state?: BluetoothIpcState) {
        if (state) {
            this.state = state;
        }

        if (this.state.knownDevices.length > 0) {
            try {
                await this.connectApi();
                await this.api.send('set_state', {
                    devices: this.state.knownDevices,
                });

                const { devices: scanResult } = await this.api
                    .send('start_scan')
                    .then(res => res)
                    // todo: bluetooth-ipc-main.init is called in inInitBluetoothThunk. If it returns an error there, thunk does not proceed and listeners are not registered.
                    // This is a hotfix, I believe, that initBluetoothThunks call to bluetoothIpc.init should only check that ipc channel is established, nothing more.
                    .catch(error => {
                        console.warn('Initial start_scan error', error);
                        if (
                            error.message.includes('Adapter disabled') || // <-- when bluetooth is off
                            error.message.includes('Adapter missing') // <-- when app permissions removed
                        ) {
                            this.emit('adapter-event', 'disabled');

                            return { devices: [] };
                        }
                        throw error;
                    });
                if (scanResult.length === 0) {
                    // wait. devices may not be returned immediately
                    await resolveAfter(1000);
                }
            } catch (error) {
                return this.result(error.message);
            }
        }

        return this.result();
    }

    async getInfo() {
        try {
            await this.connectApi();
            const info = await this.api.send('get_info');

            return { success: true as const, payload: info };
        } catch (error) {
            return { success: false as const, error };
        }
    }

    dispose() {
        return Promise.resolve(this.result());
    }

    async startScan(owner?: ScanOwner) {
        if (owner) {
            this.scanOwners.add(owner);
        }

        try {
            await this.connectApi();
        } catch (error) {
            return this.result(error.message);
        }

        if (this.isScanning) {
            return this.result();
        }

        try {
            const { devices } = await this.api.send('start_scan');
            this.isScanning = true;
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        } catch (error) {
            return this.result(error.message);
        }

        return this.result();
    }

    async stopScan(owner?: ScanOwner) {
        if (owner) {
            this.scanOwners.delete(owner);
        }

        if (this.scanOwners.size > 0) {
            return this.result();
        }

        try {
            await this.connectApi();
            this.isScanning = false;
            await this.api.send('stop_scan');
        } catch (error) {
            return this.result(error.message);
        }

        return this.result();
    }

    async connectDevice(id: string) {
        const timeout = 30000;

        try {
            await this.connectApi();
        } catch (error) {
            return this.result(error.message);
        }

        // this is intentionally not wrapped in try/catch
        // we want to remove event listeners before error is returned
        const emitDeviceUpdate = ({ device }: { device: BluetoothDevice }) =>
            this.emit('device-update', device);
        this.api.on('device_connection_status', emitDeviceUpdate);
        const result = await this.api
            .send('connect_device', { id, timeout })
            .then(() => this.result())
            .catch(error => this.result(error.message));
        this.api.off('device_connection_status', emitDeviceUpdate);

        return result;
    }

    async disconnectDevice(id: string) {
        try {
            await this.connectApi();
            await this.api.send('disconnect_device', { id });
        } catch (error) {
            return this.result(error.message);
        }

        return this.result();
    }

    async forgetDevice(id: string) {
        try {
            await this.connectApi();
            await this.api.send('forget_device', { id });
        } catch (error) {
            return this.result(error.message);
        }

        return this.result();
    }

    async enumerateDevices() {
        try {
            await this.connectApi();
            const { devices } = await this.api.send('enumerate');

            return this.filterConnectableDevices(devices);
        } catch {
            return [];
        }
    }
}
