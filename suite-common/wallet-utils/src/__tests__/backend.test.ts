import { getDefaultBackendType, isElectrumUrl, isTrezorConnectBackendType } from '../backend';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(getDefaultBackendType('btc')).toBe('blockbook');
        expect(getDefaultBackendType('ltc')).toBe('blockbook');
        expect(getDefaultBackendType('ada')).toBe('blockfrost');
        expect(getDefaultBackendType('tada')).toBe('blockfrost');
    });

    test('isElectrumUrl', () => {
        expect(isElectrumUrl('electrum.example.com:50001:t')).toBe(true);
        expect(isElectrumUrl('electrum.example.com:50001:s')).toBe(true);
        expect(isElectrumUrl('electrum.example.onion:50001:t')).toBe(true);
        expect(isElectrumUrl('electrum.example.com:50001:x')).toBe(false);
        expect(isElectrumUrl('wss://blockfrost.io')).toBe(false);
        expect(isElectrumUrl('https://google.com')).toBe(false);
        expect(isElectrumUrl('')).toBe(false);
    });

    test('isTrezorConnectBackendType', () => {
        expect(isTrezorConnectBackendType()).toBe(true);
        expect(isTrezorConnectBackendType('blockbook')).toBe(true);
        expect(isTrezorConnectBackendType('coinjoin')).toBe(false);
        // @ts-expect-error
        expect(isTrezorConnectBackendType('gibberish')).toBe(false);
        // @ts-expect-error
        expect(isTrezorConnectBackendType({})).toBe(false);
    });
});
