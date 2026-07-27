import { isWhitelistedHost } from './isWhitelistedHost';

const WHITELISTED = ['trezor.io'];

describe(isWhitelistedHost.name, () => {
    const dataProvider: Array<{ hostname: string; result: boolean }> = [
        { hostname: 'trezor.io', result: true },
        { hostname: '', result: false },
        { hostname: '    ', result: false },
        { hostname: 'hoodi.trezor.io', result: true },
        { hostname: 'tbtc.trezor.io', result: true },
        { hostname: 'scam-url.io', result: false },
        { hostname: 'scam-url-trezor.io', result: false },
    ];

    dataProvider.forEach(({ hostname, result }) => {
        it(`The '${hostname}' is ${result ? 'is allowed' : 'is NOT allowed'}`, () => {
            expect(isWhitelistedHost(hostname, WHITELISTED)).toBe(result);
        });
    });
});
