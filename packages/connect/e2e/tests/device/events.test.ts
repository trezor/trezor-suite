import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import TrezorConnect, { DEVICE_EVENT, TransportInfo } from '@trezor/connect';

describe('TrezorConnect.on(DEVICE...)', () => {
    beforeAll(async () => {
        if (typeof jest === 'undefined') return;
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.api.stopEmu();
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.startBridge();
        await TrezorUserEnvLink.api.startEmu();
    });

    afterAll(() => {
        TrezorConnect.dispose();
    });

    it('2 clients. one acquires and releases, the other one is watching', async () => {
        if (typeof jest === 'undefined') return;

        const transportStartPromise = new Promise<TransportInfo>(resolve => {
            TrezorConnect.on('transport-start', event => {
                resolve(event);
            });
        });

        const deviceEvents = [];
        const deviceEventPromise = new Promise(resolve => {
            TrezorConnect.on(DEVICE_EVENT, event => {
                deviceEvents.push(event);
                if (deviceEvents.length === 3) {
                    resolve();
                }
            });
        });

        await TrezorConnect.init({
            manifest: { email: 'meow', appUrl: 'meow' },
            transports: ['BridgeTransport'],
        });

        await expect(transportStartPromise).resolves.toEqual({
            type: 'BridgeTransport',
            version: '2.0.32',
            outdated: false,
        });

        await expect(deviceEventPromise).resolves;

        // this test is written to document current behavior. it feels odd that it first fires
        // device-changed events and only after that device-connect.but maybe this is transport start pending?
        expect(deviceEvents).toHaveLength(3);
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
        ]);
    });
});
