import { TypedEmitter } from '@trezor/utils';

import { TrezorBluetooth } from './trezor-bluetooth';
import type {
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

    async init(state?: BluetoothIpcState) {
        if (state?.knownDevices && state.knownDevices.length > 0) {
            try {
                await this.api.connect();
                await this.api.send('start_scan');
                const enumerateResult = await this.api.send('enumerate');
                await this.api.send('stop_scan');

                const emitSelect = ({ devices }: { devices: BluetoothDevice[] }) => {
                    this.emit('device-list-update', devices);
                };

                this.api.on('device_updated', emitSelect);
                this.api.on('device_connected', emitSelect);

                const promises = enumerateResult.flatMap(d => {
                    // device is already connected to BT (linux only?)
                    if (d.connected) {
                        return this.api.send('connect_device', d.id);
                    }
                    const isKnown = state.knownDevices.find(dd => dd.macAddress === d.macAddress);
                    if (isKnown) {
                        return this.api.send('connect_device', d.id);
                    }

                    return [];
                });
                // TODO: this should not be here, should be called after connect initialization
                Promise.all(promises).catch(e => {
                    // silent error
                    console.warn('initial connection error', e);
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
        // return devs.filter(d => d.data.length > 0 && (d.paired || d.data[0] === 1));
        const emitSelect = ({ devices }: { devices: BluetoothDevice[] }) => {
            this.emit('device-list-update', connectableDevices(devices));
        };
        const emitAdapterState = ({ powered }: { powered: boolean }) => {
            this.emit('adapter-event', powered);
            if (!powered) {
                // api.send('stop_scan');
            } else {
                this.api.send('start_scan').catch(error => {
                    console.warn('Start scan error', error);
                });
            }
        };

        this.api.on('device_discovered', emitSelect);
        this.api.on('device_updated', emitSelect);
        this.api.on('device_connected', emitSelect);
        this.api.on('device_disconnected', emitSelect);
        this.api.on('adapter_state_changed', emitAdapterState);

        try {
            const info = await this.api.send('get_info');
            // emit adapter event
            if (!info.powered) {
                this.emit('adapter-event', false);
            }

            const devices = await this.api.send('start_scan');
            emitSelect({ devices: connectableDevices(devices) });
        } catch (error) {
            return { success: false, error: error.message };
        }

        return { success: true } as const;
    }

    async stopScan() {
        try {
            await this.api.connect();
            await this.api.send('stop_scan');

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

        const emit = (event: BluetoothDevice) => this.emit('device-update', event);

        this.api.on('device_connection_status', emit);

        const result = await this.api
            .send('connect_device', id)
            .then(() => ({ success: true }) as const)
            .catch(error => ({ success: false, error: error.message }));

        this.api.off('device_connection_status', emit);

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
