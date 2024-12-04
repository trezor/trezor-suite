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
        // try {
        //     await this.api.connect();
        // } catch (error) {
        //     return { success: false, error: error.message };
        // }

        const emitStatus = (event: DeviceConnectionStatus) => {
            this.emit('device-connection-status', event);
        };

        // Todo: enter pairing mode
        const UUID = 'hci0/dev_E1_43_47_BA_6A_69';
        // const linuxPin = { uuid: UUID, type: 'pairing' as const, pin: '' };
        const windowsPin = {
            uuid: UUID,
            type: 'pairing' as const,
            pin: '123456',
        };

        // UI:
        //  - click button -> "Connecting"
        //  - "pair-device-event" -> pairing -> show PIN Modal
        //  - (Win/Linux) "pair-device-event" -> paired -> hide PIN Modal
        //  - "connect-device-event":start -> connecting -> hide PIN Modal (for Mac)
        //  - "connect-device-event" :done -> connected, but ...connect-connecting again

        // 1. [Win, Lin, Mac] In case of windows, this is where we get PIN, on Mac we may not get this
        await new Promise(resolve => setTimeout(resolve, 2000));
        emitStatus(windowsPin);

        // 2. [Win, Lin] Simulates that user confirmed PIN on the device
        await new Promise(resolve => setTimeout(resolve, 4000));
        emitStatus({
            uuid: UUID,
            type: 'paired',
        });

        // 3. [Win, Lin, Mac] Simulates that device is starting to connect
        await new Promise(resolve => setTimeout(resolve, 2000));
        emitStatus({
            uuid: UUID,
            type: 'connecting',
        });

        // 4. [Win, Lin, Mac] Simulates that device is starting to connect
        await new Promise(resolve => setTimeout(resolve, 2000));
        emitStatus({
            uuid: UUID,
            type: 'connected',
        });

        return { success: true } as const;

        // this.api.on('device_connection_status', event =>
        //     emitStatus({ uuid: event.uuid, type: event.phase }),
        // );
        // this.api.on('device_pairing', event => {
        //     if (!event.paired) {
        //         emitStatus({
        //             uuid,
        //             type: 'pairing',
        //             pin: event.pin,
        //         });
        //     } else {
        //         emitStatus({
        //             uuid: event.uuid,
        //             type: 'paired',
        //         });
        //     }
        // });
        //
        // try {
        //     const result = await this.api.send('connect_device', uuid);
        //     console.warn('Connect result', result);
        // } catch (error) {
        //     return { success: false, error: error.message };
        // }
        //
        // return { success: true } as const;
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
            this.emit('device-list-update', [
                {
                    name: 'TrezorZephyr',
                    internal_model: 1,
                    model_variant: 3,
                    uuid: 'hci0/dev_E1_43_47_BA_6A_69',
                    connected: false,
                    timestamp: 1732787043,
                    rssi: 0,
                    pairing_mode: false,
                    paired: true,
                    data: [
                        // 1. "pairing_mode" - prvni byte  jesli device vubec je pairovatelny (a ma se vubec zobrazit v ui)
                        1,

                        // 2. "model_variant" - jeden byte, vlastne nemusi to byt jen color, nekdy v budocnosti treba tam muze byt i nejaka jina specificka vlastnost,
                        // typu, ma NFC, nema NFC. neni to zatim nikde zdefiniovany mapa musi teprv vzniknout vajemnou domluvou, trezor zatim posila zahardcodovanou
                        // value, udelal jsem na to nejakou TODO utilitku v jedne z komponent
                        1,

                        // 3. "internal_model" - jeden byte, bude nejak namapovany cislo na enum DeviceIntrenalModel v trezor/connect.
                        // opet neni nikde zdefiniovany, trezor posila zahardcodovany, a je na to TODO utilitka v te componente
                        3,
                    ],
                },
                ...devices,
            ]);

            // this.emit('device-list-update', connectableDevices(devices));
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
