import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getDefaultBackendType, isTrezorConnectBackendType } from './backendUtils';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(getDefaultBackendType(asNetworkSymbol('btc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ltc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ada'))).toBe('blockfrost');
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
