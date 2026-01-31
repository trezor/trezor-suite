import { DataManager } from '../DataManager';

const settings = {
    transportReconnect: true,
    debug: false,
    webusb: true,
    pendingTransportEvent: false,
    manifest: {
        email: 'info@trezor.io',
        appName: 'Trezor Connect Tests',
        appUrl: 'https://connect.trezor.io/9/',
    },
    // internal part, not to be accepted from .init()
    origin: '',
    configSrc: 'NOT-USED-ANYMORE',
    popupSrc: '',
    deeplinkUrl: '',
    version: '9.0.0',
    priority: 1,
    supportedBrowser: true,
    extension: '',
    env: 'node' as const,
    timestamp: 1,
};

describe('data/DataManager', () => {
    beforeEach(async () => {
        try {
            await DataManager.load(settings, false, true);
        } catch (err) {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(err).toBe(undefined);
        }
    });

    test('getSettings', () => {
        expect(DataManager.getSettings()).toEqual(settings);
        // @ts-expect-error
        expect(DataManager.getSettings('foo')).toEqual(undefined);
    });
});
