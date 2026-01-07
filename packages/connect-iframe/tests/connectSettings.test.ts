import { parseConnectSettings } from '../src/connectSettings';

declare let window: any; // Window['location'] types doesn't allow location mocks
declare let navigator: any;

describe('connect-iframe parseConnectSettings', () => {
    const { location } = window;
    beforeEach(() => {
        delete window.location;
        window.location = {
            protocol: 'https:',
            hostname: 'connect.trezor.io',
            href: 'https://connect.trezor.io',
            toString: () => 'https://connect.trezor.io',
        };
        navigator.usb = {};
    });
    afterAll(() => {
        window.location = location; // restore default
    });

    it('WebUsbTransport disabled for file:// protocol', () => {
        window.location = {
            protocol: 'file:',
            pathname: '/User/local-path',
        };
        expect(parseConnectSettings({ transports: ['WebUsbTransport'] }, '')).toMatchObject({
            transports: [],
            origin: 'file:///User/local-path',
        });
    });

    it('WebUsbTransport disabled when host origin does not match iframe origin', () => {
        expect(
            parseConnectSettings({ transports: ['WebUsbTransport'] }, 'www.hostorigin.meow'),
        ).toMatchObject({
            transports: [],
        });

        expect(
            parseConnectSettings({ transports: ['WebUsbTransport'], env: 'webextension' }, ''),
        ).toMatchObject({
            transports: ['WebUsbTransport'],
        });
    });

    it('priority', () => {
        expect(parseConnectSettings({}, 'https://connect.trezor.io')).toMatchObject({
            origin: 'https://connect.trezor.io',
            priority: 0,
        });
        expect(parseConnectSettings({}, 'https://3rdparty.site')).toMatchObject({
            origin: 'https://3rdparty.site',
            priority: 2,
        });
    });
});
