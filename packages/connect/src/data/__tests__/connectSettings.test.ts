import { corsValidator, parseConnectSettings } from '../connectSettings';

declare let window: any; // window.location types doesn't allow deleting/overriding location

describe('data/connectSettings', () => {
    const { location } = window;
    beforeAll(() => {
        delete window.location;
    });
    afterAll(() => {
        window.location = location; // restore default
    });

    it('corsValidator', () => {
        expect(corsValidator('https://connect.trezor.io/9-beta/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.trezor.io/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.trezor.io/')).toBeDefined();
        expect(corsValidator('https://trezor.sldev.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezor.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezorxio/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.trezor.io/')).not.toBeDefined();
        expect(corsValidator('https://connect.trezor.io')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.trezor.io/')).not.toBeDefined(); // missing https
        expect(corsValidator('https://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://localhost:5088/')).toBeDefined();
        expect(corsValidator('https://localhost:8088/subdir/')).toBeDefined();
        expect(corsValidator('http://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://connect.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://sldev.trezor.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldevxcz/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.sldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://connect.sldev.cz')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.sldev.cz/')).not.toBeDefined(); // missing https
        // @ts-expect-error
        expect(corsValidator(null)).not.toBeDefined();
        expect(corsValidator(undefined)).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator({})).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator(1)).not.toBeDefined();
        expect(corsValidator('https://other-domain.com/connect.trezor.io/9/')).not.toBeDefined();
    });

    it('parseConnectSettings: custom connect src', () => {
        window.location = { search: 'trezor-connect-src=https://connect.trezor.io/beta.1/' };
        expect(parseConnectSettings({}).connectSrc).toEqual('https://connect.trezor.io/beta.1/');

        window.location = {
            search: 'foo=bar&trezor-connect-src=https://connect.trezor.io/beta.2/',
        };
        expect(parseConnectSettings({}).connectSrc).toEqual('https://connect.trezor.io/beta.2/');

        window.location = {
            search: 'trezor-connect-src=https://connect.trezor.io/beta.3/&foo=bar',
        };
        expect(parseConnectSettings({}).connectSrc).toEqual('https://connect.trezor.io/beta.3/');

        window.location = {
            search: 'trezor-connect-src=https%3A%2F%2Fconnect.trezor.io%2Fbeta.encoded%2F',
        }; // encoded
        expect(parseConnectSettings({}).connectSrc).toEqual(
            'https://connect.trezor.io/beta.encoded/',
        );

        window.location = { search: 'trezor-connect-src=https://connect-beta.trezor.oi/beta.3/' }; // invalid domain "io"
        expect(parseConnectSettings({}).connectSrc).toEqual(undefined);

        delete window.location.search; // restore

        window.__TREZOR_CONNECT_SRC = 'https://connect.trezor.io/beta.4/';
        expect(parseConnectSettings({}).connectSrc).toEqual('https://connect.trezor.io/beta.4/');

        window.__TREZOR_CONNECT_SRC = 'https://connect-beta.trezor.oi/beta.4/'; // invalid domain
        expect(parseConnectSettings({}).connectSrc).toEqual(undefined);

        delete window.__TREZOR_CONNECT_SRC; // restore

        // @ts-expect-error
        global.window = undefined;
        global.__TREZOR_CONNECT_SRC = 'https://connect.trezor.io/beta.5/';
        expect(parseConnectSettings({}).connectSrc).toEqual('https://connect.trezor.io/beta.5/');
        delete global.__TREZOR_CONNECT_SRC; // restore
    });
});
