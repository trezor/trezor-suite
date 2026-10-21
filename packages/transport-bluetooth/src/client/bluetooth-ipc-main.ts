import { TypedEmitter, createLazy, resolveAfter } from '@trezor/utils';

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

type ConnectResult = IpcFailure | { success: true; api: TrezorBluetooth };

/*
 * used in @suite/desktop-app-main nodejs (main) context
 * unavailable in browser (renderer) context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    private state: BluetoothIpcState = { knownDevices: [] };
    private shouldScan = false;
    private scanOwners = new Set<ScanOwner>();
    private scanPromise: Promise<unknown> = Promise.resolve();
    private initialSettings: TrezorBluetoothSettings;
    // holds a client only when it is fully initialized, concurrent callers share one attempt
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

    private failure(error: unknown): IpcFailure {
        const hasMessage = typeof error === 'object' && error !== null && 'message' in error;
        const message = hasMessage ? String(error.message) : String(error);

        return { success: false, error: { message, code: 'Bluetooth_Error' } };
    }

    private result(): IpcSuccess<undefined> {
        return { success: true };
    }

    // concurrent callers share one connection attempt, it never rejects
    private async connectApi(): Promise<ConnectResult> {
        // a lost connection gets a new client
        if (this.api && !this.api.isConnected()) {
            await this.lazyApi.dispose();
        }

        try {
            return { success: true, api: await this.lazyApi.getOrInit() };
        } catch (error) {
            return this.failure(error);
        }
    }

    private attachListeners(api: TrezorBluetooth) {
        const emitListUpdate = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', this.filterConnectableDevices(devices));
        };

        const emitAdapterState = ({ state }: { state: BluetoothAdapterState }) => {
            this.emit('adapter-event', state);
            if (state === 'enabled' && this.shouldScan) {
                // auto restart scan if adapter becomes enabled
                this.serializeScan(async () => {
                    if (!this.shouldScan) return;
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

    // the client once it is ready, waiting for an attempt in flight
    private async getReadyApi() {
        await this.lazyApi.getPending()?.catch(() => {});
        const { api } = this;

        return api?.isConnected() ? api : undefined;
    }

    private async createApi() {
        const api = new TrezorBluetooth(this.initialSettings);
        try {
            this.attachListeners(api);
            await api.connect();
            await api.send('set_state', { devices: this.state.knownDevices });
        } catch (error) {
            // a connection without the state would be treated as ready by the next call
            api.dispose();

            throw error;
        }

        return api;
    }

    async init(state?: BluetoothIpcState) {
        if (state) {
            this.state = state;

            // set_state is otherwise sent only when connecting
            const api = await this.getReadyApi();
            if (api) {
                try {
                    await api.send('set_state', { devices: this.state.knownDevices });
                } catch (error) {
                    return this.failure(error);
                }
            }
        }

        if (this.state.knownDevices.length > 0) {
            try {
                const connection = await this.connectApi();
                if (!connection.success) return connection;

                const initialScan = await connection.api
                    .send('start_scan')
                    // todo: bluetooth-ipc-main.init is called in inInitBluetoothThunk. If it returns an error there, thunk does not proceed and listeners are not registered.
                    // This is a hotfix, I believe, that initBluetoothThunks call to bluetoothIpc.init should only check that ipc channel is established, nothing more.
                    .catch(error => {
                        console.warn('Initial start_scan error', error);
                        if (
                            error.message.includes('Adapter disabled') || // <-- when bluetooth is off
                            error.message.includes('Adapter missing') // <-- when app permissions removed
                        ) {
                            this.emit('adapter-event', 'disabled');

                            return undefined;
                        }
                        throw error;
                    });

                if (!initialScan) {
                    // Nothing is scanning, so there is nothing to wait for.
                    return this.result();
                }

                if (initialScan.devices.length === 0) {
                    // wait. devices may not be returned immediately
                    await resolveAfter(1000);
                }

                // Block start_scan before this stop.
                await this.serializeScan(async () => {
                    if (this.shouldScan) return;
                    await connection.api.send('stop_scan');
                }).catch(error => {
                    console.warn('Initial stop_scan error', error);
                });
            } catch (error) {
                return this.failure(error);
            }
        }

        return this.result();
    }

    async getInfo() {
        const connection = await this.connectApi();
        if (!connection.success) return connection;

        try {
            const info = await connection.api.send('get_info');

            return { success: true as const, payload: info };
        } catch (error) {
            return this.failure(error);
        }
    }

    async dispose() {
        this.shouldScan = false;
        this.scanOwners.clear();
        // queued scan actions connect the client, so they must finish before it is disposed
        await this.serializeScan(() => this.lazyApi.dispose());

        return this.result();
    }

    startScan(owner: ScanOwner) {
        this.shouldScan = true;
        this.scanOwners.add(owner);

        return this.serializeScan(async () => {
            try {
                const connection = await this.connectApi();
                if (!connection.success) return connection;

                const { devices } = await connection.api.send('start_scan');

                this.emit('device-list-update', this.filterConnectableDevices(devices));

                return this.result();
            } catch (error) {
                return this.failure(error);
            }
        });
    }

    stopScan(owner: ScanOwner) {
        this.scanOwners.delete(owner);

        if (this.scanOwners.size > 0) {
            return Promise.resolve(this.result());
        }

        this.shouldScan = false;

        return this.serializeScan(async () => {
            if (this.shouldScan || this.scanOwners.size > 0) {
                return this.result();
            }

            // an in-flight connection may resume the scan, wait for it before deciding
            const api = await this.getReadyApi();
            // nothing to stop if the process was never started
            if (!api) {
                return this.result();
            }

            if (this.shouldScan || this.scanOwners.size > 0) {
                return this.result();
            }

            try {
                await api.send('stop_scan');

                return this.result();
            } catch (error) {
                return this.failure(error);
            }
        });
    }

    async connectDevice(id: string) {
        const timeout = 30000;

        const connection = await this.connectApi();
        if (!connection.success) return connection;
        const { api } = connection;

        // this is intentionally not wrapped in try/catch
        // we want to remove event listeners before error is returned
        const emitDeviceUpdate = ({ device }: { device: BluetoothDevice }) =>
            this.emit('device-update', device);
        api.on('device_connection_status', emitDeviceUpdate);
        const result = await api
            .send('connect_device', { id, timeout })
            .then(() => this.result())
            .catch(error => this.failure(error));
        api.off('device_connection_status', emitDeviceUpdate);

        return result;
    }

    async disconnectDevice(id: string) {
        const connection = await this.connectApi();
        if (!connection.success) return connection;

        try {
            await connection.api.send('disconnect_device', { id });
        } catch (error) {
            return this.failure(error);
        }

        return this.result();
    }

    async forgetDevice(id: string) {
        const connection = await this.connectApi();
        if (!connection.success) return connection;

        try {
            await connection.api.send('forget_device', { id });
        } catch (error) {
            return this.failure(error);
        }

        return this.result();
    }

    async enumerateDevices() {
        const connection = await this.connectApi();
        if (!connection.success) return [];

        try {
            const { devices } = await connection.api.send('enumerate');

            return this.filterConnectableDevices(devices);
        } catch {
            return [];
        }
    }
}
