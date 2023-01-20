import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import TrezorConnect, { DeviceEventMessage, TransportEventMessage } from '@trezor/connect';

describe('TrezorConnect.on(DEVICE...)', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.api.stopEmu();
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.startBridge();
        await TrezorUserEnvLink.api.startEmu();
    });

    afterAll(async () => {
        await TrezorConnect.dispose();
    });

    it('basic transport and device events test', async () => {
        const transportEvents: TransportEventMessage[] = [];
        const transportStartPromise = new Promise<TransportEventMessage>(resolve => {
            TrezorConnect.on('TRANSPORT_EVENT', event => {
                console.log(event);
                transportEvents.push(event);
                resolve(event);
            });
        });

        const deviceEvents: DeviceEventMessage[] = [];
        const deviceEventPromise = new Promise<DeviceEventMessage>(resolve => {
            TrezorConnect.on('DEVICE_EVENT', event => {
                console.log(event);
                deviceEvents.push(event);
                if (deviceEvents.length === 4) {
                    resolve(event);
                }
            });
        });

        await TrezorConnect.init({
            manifest: { email: 'meow', appUrl: 'meow' },
            popup: false,
            webusb: false,
            debug: false,
        });

        await transportStartPromise;

        expect(transportEvents).toMatchObject([
            {
                event: 'TRANSPORT_EVENT',
                type: 'transport-start',
            },
        ]);

        await TrezorUserEnvLink.api.stopEmu();

        await deviceEventPromise;

        expect(deviceEvents.length).toEqual(4);
        expect(deviceEvents).toMatchObject([
            {
                event: 'DEVICE_EVENT',
                type: 'device-changed',
                payload: { type: 'unacquired', path: '1', label: 'Unacquired device' },
            },
            {
                event: 'DEVICE_EVENT',
                type: 'device-changed',
                payload: { type: 'acquired' },
            },
            {
                event: 'DEVICE_EVENT',
                type: 'device-connect',
                payload: { type: 'acquired' },
            },
            {
                event: 'DEVICE_EVENT',
                type: 'device-disconnect',
            },
        ]);
    });
});
