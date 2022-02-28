import * as utils from '../backend';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(utils.getDefaultBackendType('btc')).toBe('blockbook');
        expect(utils.getDefaultBackendType('ltc')).toBe('blockbook');
        expect(utils.getDefaultBackendType('ada')).toBe('blockfrost');
        expect(utils.getDefaultBackendType('tada')).toBe('blockfrost');
    });

    test('isElectrumUrl', () => {
        expect(utils.isElectrumUrl('electrum.foobar.com:50001:t')).toBe(true);
        expect(utils.isElectrumUrl('electrum.foobar.com:50001:s')).toBe(true);
        expect(utils.isElectrumUrl('electrum.foobar.onion:50001:t')).toBe(true);
        expect(utils.isElectrumUrl('electrum.foobar.com:50001:x')).toBe(false);
        expect(utils.isElectrumUrl('wss://blockfrost.io')).toBe(false);
        expect(utils.isElectrumUrl('https://google.com')).toBe(false);
        expect(utils.isElectrumUrl('')).toBe(false);
    });

    test('getElectrumHost', () => {
        expect(utils.getElectrumHost('electrum.foobar.com:50001:t')).toBe('electrum.foobar.com');
        expect(utils.getElectrumHost('electrum.foobar.com:50001:s')).toBe('electrum.foobar.com');
        expect(utils.getElectrumHost('electrum.foobar.onion:50001:t')).toBe(
            'electrum.foobar.onion',
        );
        expect(utils.getElectrumHost('electrum.foobar.com:50001:x')).toBe(undefined);
        expect(utils.getElectrumHost('wss://blockfrost.io')).toBe(undefined);
        expect(utils.getElectrumHost('https://google.com')).toBe(undefined);
        expect(utils.getElectrumHost('')).toBe(undefined);
    });
});
