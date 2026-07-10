import { getWrappedNativeAddress, isWrappedNativeToken } from '../wrappedNativeToken';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const WETH_ADDRESS_CHECKSUMMED = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

describe('getWrappedNativeAddress', () => {
    it('returns the WETH address for eth', () => {
        expect(getWrappedNativeAddress('eth')).toBe(WETH_ADDRESS);
    });

    it('returns undefined for networks without a wrapped native token', () => {
        expect(getWrappedNativeAddress('btc')).toBeUndefined();
    });
});

describe('isWrappedNativeToken', () => {
    it('matches the canonical WETH address regardless of case', () => {
        expect(isWrappedNativeToken('eth', WETH_ADDRESS)).toBe(true);
        expect(isWrappedNativeToken('eth', WETH_ADDRESS_CHECKSUMMED)).toBe(true);
    });

    it('does not match a different address', () => {
        expect(isWrappedNativeToken('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
            false,
        );
    });

    it('does not match on networks without a wrapped native token', () => {
        expect(isWrappedNativeToken('btc', WETH_ADDRESS)).toBe(false);
    });

    it('does not match a missing address', () => {
        expect(isWrappedNativeToken('eth', null)).toBe(false);
        expect(isWrappedNativeToken('eth', undefined)).toBe(false);
    });
});
