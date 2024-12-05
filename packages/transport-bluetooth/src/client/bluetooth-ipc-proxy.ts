import { TypedEmitter } from '@trezor/utils';

import { TrezorBle } from './trezor-ble';
import type {
    TrezorBleSettings,
    BluetoothIpcApi,
    BluetoothApiEvents,
    BluetoothDevice,
    DeviceConnectionStatus,
} from './types';

const notImplemented = (): any => {
    throw new Error('Method not implemented.');
};

// override this object with proxy
export const bluetoothManager: BluetoothIpcApi = {
    getAvailability: notImplemented,
    connectDevice: notImplemented,
    disconnectDevice: notImplemented,
    forgetDevice: notImplemented,
    startScan: notImplemented,
    stopScan: notImplemented,
    on: notImplemented,
    off: notImplemented,
    removeAllListeners: notImplemented,
};

// class implemented in electron main context
// should be overriden in electron renderer context
export class BluetoothApiImpl extends TypedEmitter<BluetoothApiEvents> implements BluetoothIpcApi {
    private api: TrezorBle;

    constructor(settings: TrezorBleSettings) {
        super();
        this.api = new TrezorBle(settings);
    }

    getAvailability() {
        // throw new Error('Method not implemented.');
        return Promise.resolve({ success: true, payload: true } as const);
    }

    disconnectDevice() {
        // throw new Error('Method not implemented.');
        return Promise.resolve({ success: true, payload: true } as const);
    }

    async connectDevice(uuid: string) {
        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const emitStatus = (event: DeviceConnectionStatus) => {
            this.emit('device-connection-status', event);
        };

        this.api.on('device_connection_status', event =>
            emitStatus({ uuid: event.uuid, type: event.phase }),
        );
        this.api.on('device_pairing', event => {
            if (!event.paired) {
                emitStatus({
                    uuid,
                    type: 'pairing',
                    pin: event.pin,
                });
            } else {
                emitStatus({
                    uuid: event.uuid,
                    type: 'paired',
                });
            }
        });

        try {
            const result = await this.api.send('connect_device', uuid);
            console.warn('Connect result', result);
        } catch (error) {
            return { success: false, error: error.message };
        }

        return { success: true } as const;
    }

    async forgetDevice(id: string): Promise<any> {
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
    }

    async startScan() {
        try {
            await this.api.connect();
        } catch (error) {
            return { success: false, error: error.message };
        }

        const connectableDevices = (devs: BluetoothDevice[]) => {
            return devs
                .filter(d => d.paired || (d.data && d.data[0] === 1))
                .map(d => {
                    // TODO: paired device on linux adv. data missing
                    if (d.paired && d.data.length === 0) {
                        d.data.push(1, 1, 1);
                    }

                    return d;
                });
            // return devs.filter(d => d.data.length > 0 && (d.paired || d.data[0] === 1));
        };
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
}
