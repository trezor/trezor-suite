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

describe('DataManager', () => {
    beforeEach(async () => {
        try {
            await DataManager.load(settings, false);
        } catch (err) {
            expect(err).toBe(undefined);
        }
    });

    test('isWhitelisted', () => {
        expect(DataManager.isWhitelisted('https://trezor.io')).toEqual({
            origin: 'trezor.io',
            priority: 0,
        });
        expect(DataManager.isWhitelisted('http://github.com')).toEqual(undefined);
    });

    test('isManagementAllowed', () => {
        expect(DataManager.isManagementAllowed()).toEqual(undefined);
    });

    test('getPriority', () => {
        expect(DataManager.getPriority()).toEqual(2);
    });

    test('getHostLabel', () => {
        expect(DataManager.getHostLabel('webextension@metamask.io')).toEqual({
            icon: './data/icons/metamask.svg',
            label: 'MetaMask',
            origin: 'webextension@metamask.io',
        });
    });

    test('getSettings', () => {
        expect(DataManager.getSettings('connectSrc')).toEqual(settings.connectSrc);
        expect(DataManager.getSettings()).toEqual(settings);
        // @ts-expect-error
        expect(DataManager.getSettings('foo')).toEqual(undefined);
    });

    test('getDebugSettings', () => {
        expect(DataManager.getDebugSettings()).toEqual(false);
    });

    test('getConfig', () => {});
});
