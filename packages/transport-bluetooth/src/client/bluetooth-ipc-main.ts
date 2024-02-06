import { TypedEmitter } from '@trezor/utils';

import { TrezorBle } from './trezor-ble';
import type {
    BluetoothDevice,
    BluetoothIpcApi,
    BluetoothIpcEvents,
    BluetoothIpcState,
    DeviceConnectionStatus,
    TrezorBleSettings,
} from './types';

/*
 * used in @trezor/suite-desktop-core main context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    private api: TrezorBle;
    private state: BluetoothIpcState = { knownDevices: [] };

    constructor(settings: TrezorBleSettings) {
        super();
        this.api = new TrezorBle(settings);
    }

    init(state?: BluetoothIpcState) {
        if (state) {
            return this.setState(state);
        }

        return Promise.resolve({ success: true, payload: true } as const);
    }

    disconnectDevice(id: string) {
        if (id) {
            throw new Error('TODO BluetoothIpc.disconnect');
        }

        return Promise.resolve({ success: true, payload: true } as const);
    }

    async connectDevice(id: string) {
        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const emitStatus = (event: DeviceConnectionStatus) => {
            this.emit('device-connection-status', event);
        };

        this.api.on('device_connection_status', event =>
            emitStatus({ id: event.id, type: event.phase }),
        );
        this.api.on('device_pairing', event => {
            if (!event.paired) {
                emitStatus({
                    id,
                    type: 'pairing',
                    pin: event.pin,
                });
            } else {
                emitStatus({
                    id: event.id,
                    type: 'paired',
                });
            }
        });

        try {
            const result = await this.api.send('connect_device', id);
            console.warn('Connect result', result);
        } catch (error) {
            return { success: false, error: error.message };
        }

        return { success: true } as const;
    }

    async forgetDevice(id: string) {
        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const result = await this.api
            .send('forget_device', id)
            .then(() => ({ success: true }) as const)
            .catch(error => ({ success: false, error: error.message }));
        console.warn('Forget result', result);

        return result;
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
                        this.state.knownDevices.find(dev => d.address === dev.address) ||
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
            console.warn('FINALLY!!!');
            this.api.removeAllListeners();
            this.api.disconnect();
        }
    }

    async setState(state: BluetoothIpcState) {
        this.state = state;
        if (state.knownDevices.length > 0) {
            try {
                await this.api.connect();
                await this.api.send('start_scan');
                const devices = await this.api.send('enumerate');

                const promises = devices.flatMap(d => {
                    // device is already connected to BT (linux only?)
                    if (d.connected) {
                        return this.api.send('connect_device', d.id);
                    }
                    const isKnown = state.knownDevices.find(dd => dd.address === d.address);
                    if (isKnown) {
                        return this.api.send('connect_device', d.id);
                    }

                    return [];
                });
                await Promise.all(promises);

                await this.api.send('stop_scan');
            } catch (e) {
                console.warn('initial scan error', e);
            }
        }

        return Promise.resolve({ success: true } as const);
    }
}
