import { getGlobalConnectSrc } from '../src/connectSettings';

declare let window: any; // Window['location'] types doesn't allow location mocks

describe('connect-web parseConnectSettings', () => {
    const { location } = window;
    beforeEach(() => {
        delete window.location;
        window.location = {
            protocol: 'https:',
            hostname: 'connect.trezor.io',
            href: 'https://connect.trezor.io',
            toString: () => 'https://connect.trezor.io',
        };
    });
    afterAll(() => {
        window.location = location; // restore default
    });

    it('getGlobalConnectSrc: connect src in window/global scope', () => {
        window.__TREZOR_CONNECT_SRC = 'https://connect.trezor.io/beta.4/';
        expect(getGlobalConnectSrc()).toEqual('https://connect.trezor.io/beta.4/');
        delete window.__TREZOR_CONNECT_SRC; // restore

        // @ts-expect-error
        global.window = undefined;
        // @ts-expect-error
        global.__TREZOR_CONNECT_SRC = 'https://connect.trezor.io/beta.5/';
        expect(getGlobalConnectSrc()).toEqual('https://connect.trezor.io/beta.5/');
        // @ts-expect-error
        delete global.__TREZOR_CONNECT_SRC; // restore

        expect(getGlobalConnectSrc()).toEqual(undefined);
    });
});
