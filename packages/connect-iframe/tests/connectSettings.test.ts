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

    it('trustedHost + popup + debug (iframe localhost location)', () => {
        window.location = {
            protocol: 'http:',
            hostname: 'localhost',
        };

        expect(parseConnectSettings({ popup: false, debug: true }, '')).toMatchObject({
            trustedHost: true,
            popup: false,
            debug: true,
        });

        expect(parseConnectSettings({ popup: true, debug: true }, '')).toMatchObject({
            trustedHost: true,
            popup: true,
            debug: true,
        });
    });

    it('trustedHost + popup + debug (iframe online location)', () => {
        expect(
            parseConnectSettings({ popup: false, debug: true }, 'https://connect.trezor.io'),
        ).toMatchObject({
            trustedHost: true,
            popup: false,
            debug: true,
        });

        expect(
            parseConnectSettings({ popup: true, debug: true }, 'https://connect.trezor.io'),
        ).toMatchObject({
            trustedHost: true, // because of whitelisted origin
            popup: true,
            debug: true, // because of whitelisted origin
        });

        expect(parseConnectSettings({ popup: false, debug: true }, '')).toMatchObject({
            trustedHost: false,
            popup: true,
            debug: false,
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
