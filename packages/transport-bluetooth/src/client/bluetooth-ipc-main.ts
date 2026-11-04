import { TypedEmitter, createLazy } from '@trezor/utils';

import { TrezorBluetooth } from './trezor-bluetooth';
import type {
    BluetoothAdapterState,
    BluetoothDevice,
    BluetoothIpcApi,
    BluetoothIpcEvents,
    BluetoothIpcState,
    IpcFailure,
    IpcSuccess,
    ScanOwner,
    TrezorBluetoothSettings,
} from './types';

/*
 * used in @suite-app/desktop-app-main nodejs (main) context
 * unavailable in browser (renderer) context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    private state: BluetoothIpcState = { knownDevices: [] };
    private scanOwners = new Set<ScanOwner>();
    private scanPromise: Promise<unknown> = Promise.resolve();
    private initialSettings: TrezorBluetoothSettings;
    private createApiController: AbortController | undefined;
    // holds a client only when it is fully initialized,
    // concurrent callers share one attempt.
    private lazyApi = createLazy(
        () => this.createApi(),
        api => api.dispose(),
    );

    constructor(settings: TrezorBluetoothSettings) {
        super();
        this.initialSettings = settings;
    }

    private get api() {
        return this.lazyApi.get();
    }

    private serializeScan<T>(action: () => Promise<T>): Promise<T> {
        const next = this.scanPromise.catch(() => {}).then(action);
        this.scanPromise = next;

        return next;
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

    private failure(message: string): IpcFailure {
        return { success: false, error: { message, code: 'Bluetooth_Error' } };
    }

    private result(): IpcSuccess<undefined> {
        return { success: true };
    }

    // concurrent callers share one connection attempt
    private async connectApi() {
        // a lost connection gets a new client
        if (this.api && !this.api.isConnected()) {
            await this.lazyApi.dispose();
        }

        return this.lazyApi.getOrInit();
    }

    private attachListeners(api: TrezorBluetooth) {
        const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        };

        const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
            this.emit('adapter-event', state);
            if (state === 'enabled' && this.scanOwners.size > 0) {
                // auto restart scan if adapter becomes enabled
                this.serializeScan(async () => {
                    if (this.scanOwners.size === 0) return;
                    await api.send('start_scan');
                }).catch(error => {
                    console.warn('Auto start_scan error', error);
                });
            }
        };

        api.on('device_discovered', emitListUpdate);
        api.on('device_connected', emitListUpdate);
        api.on('device_disconnected', emitListUpdate);
        api.on('adapter_state_changed', emitAdapterState);
        api.on('device_updated', ({ id, devices }) => {
            emitListUpdate({ devices });
            const device = this.filterConnectableDevices(devices).find(d => d.id === id);
            if (device) {
                this.emit('device-update', device);
            }
        });

        api.on('open_bluetooth_settings', event => {
            this.emit('open-bluetooth-settings', event);
        });
    }

    private async createApi() {
        const api = new TrezorBluetooth(this.initialSettings);
        const controller = new AbortController();
        const { signal } = controller;
        this.createApiController = controller;
        // closing the client rejects a request in flight
        const closeClient = () => api.dispose();
        signal.addEventListener('abort', closeClient, { once: true });

        try {
            this.attachListeners(api);
            await api.connect({ signal });
            await api.send('set_state', { devices: this.state.knownDevices });
        } catch (error) {
            // a connection without the state would be treated as ready by the next call
            api.dispose();

            throw error;
        } finally {
            signal.removeEventListener('abort', closeClient);
            if (this.createApiController === controller) this.createApiController = undefined;
        }

        return api;
    }

    async init(state?: BluetoothIpcState) {
        if (state) {
            this.state = state;
        }

        if (this.state.knownDevices.length > 0) {
            try {
                await this.connectApi();
            } catch (error) {
                return this.failure(error.message);
            }
        }

        return this.result();
    }

    async getInfo() {
        try {
            const api = await this.connectApi();
            const info = await api.send('get_info');

            return { success: true as const, payload: info };
        } catch (error) {
            return this.failure(error.message);
        }
    }

    async dispose() {
        this.scanOwners.clear();
        this.createApiController?.abort(new Error('Disposed during initialization'));
        await this.lazyApi.dispose();

        return this.result();
    }

    startScan(owner: ScanOwner) {
        this.scanOwners.add(owner);

        return this.serializeScan(async () => {
            // stopped or disposed while waiting in the queue
            if (!this.scanOwners.has(owner)) return this.result();

            try {
                const api = await this.connectApi();
                const { devices } = await api.send('start_scan');

                this.emit('device-list-update', this.filterConnectableDevices(devices));

                return this.result();
            } catch (error) {
                return this.failure(error.message);
            }
        });
    }

    stopScan(owner: ScanOwner) {
        this.scanOwners.delete(owner);

        if (this.scanOwners.size > 0) {
            return Promise.resolve(this.result());
        }

        return this.serializeScan(async () => {
            if (this.scanOwners.size > 0) {
                return this.result();
            }

            // nothing to stop if the process was never started
            const { api } = this;
            if (!api?.isConnected()) {
                return this.result();
            }

            try {
                await api.send('stop_scan');

                return this.result();
            } catch (error) {
                return this.failure(error.message);
            }
        });
    }

    async connectDevice(id: string) {
        const timeout = 30000;

        let api: TrezorBluetooth;
        try {
            api = await this.connectApi();
        } catch (error) {
            return this.failure(error.message);
        }

        // this is intentionally not wrapped in try/catch
        // we want to remove event listeners before error is returned
        const emitDeviceUpdate = ({ device }: { device: BluetoothDevice }) =>
            this.emit('device-update', device);
        api.on('device_connection_status', emitDeviceUpdate);
        const result = await api
            .send('connect_device', { id, timeout })
            .then(() => this.result())
            .catch(error => this.failure(error.message));
        api.off('device_connection_status', emitDeviceUpdate);

        return result;
    }

    async disconnectDevice(id: string) {
        try {
            const api = await this.connectApi();
            await api.send('disconnect_device', { id });
        } catch (error) {
            return this.failure(error.message);
        }

        return this.result();
    }

    async forgetDevice(id: string) {
        try {
            const api = await this.connectApi();
            await api.send('forget_device', { id });
        } catch (error) {
            return this.failure(error.message);
        }

        return this.result();
    }

    async enumerateDevices() {
        try {
            const api = await this.connectApi();
            const { devices } = await api.send('enumerate');

            return this.filterConnectableDevices(devices);
        } catch {
            return [];
        }
    }
}
