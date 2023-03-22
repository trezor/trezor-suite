import { DataManager } from '../DataManager';

const settings = {
    connectSrc: 'https://connect.trezor.io/9/',
    transportReconnect: true,
    debug: false,
    popup: false,
    webusb: true,
    pendingTransportEvent: false,
    manifest: {
        email: 'info@trezor.io',
        appUrl: 'https://connect.trezor.io/9/',
    },
    // internal part, not to be accepted from .init()
    origin: '',
    configSrc: 'NOT-USED-ANYMORE',
    iframeSrc: '',
    popupSrc: '',
    webusbSrc: '',
    version: '9.0.0',
    priority: 1,
    trustedHost: true,
    supportedBrowser: true,
    extension: '',
    env: 'node' as const,
    timestamp: 1,
};

describe('data/DataManager', () => {
    beforeEach(async () => {
        try {
            await DataManager.load(settings, false);
        } catch (err) {
            expect(err).toBe(undefined);
        }
    });

    test('getSettings', () => {
        expect(DataManager.getSettings('connectSrc')).toEqual(settings.connectSrc);
        expect(DataManager.getSettings()).toEqual(settings);
        // @ts-expect-error
        expect(DataManager.getSettings('foo')).toEqual(undefined);
    });
});
