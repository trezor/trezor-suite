import { getDefaultBackendType, isTrezorConnectBackendType } from '../backendUtils';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(getDefaultBackendType('btc')).toBe('blockbook');
        expect(getDefaultBackendType('ltc')).toBe('blockbook');
        expect(getDefaultBackendType('ada')).toBe('blockfrost');
        expect(getDefaultBackendType('tada')).toBe('blockfrost');
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
