import {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    isWrappedNativeToken,
} from './wrappedNativeToken';

describe(getWrappedNativeAddress.name, () => {
    it('returns the wrapped native address for a supported network', () => {
        expect(getWrappedNativeAddress('eth')).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    });

    it('returns the wrapped native address for a testnet', () => {
        expect(getWrappedNativeAddress('tsep')).toBe('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9');
    });

    it('returns undefined for a network without a wrapped native token', () => {
        expect(getWrappedNativeAddress('btc')).toBeUndefined();
    });
});

describe(getWrappedNativeSymbol.name, () => {
    it('returns the wrapped native symbol for a supported network', () => {
        expect(getWrappedNativeSymbol('bsc')).toBe('WBNB');
        expect(getWrappedNativeSymbol('pol')).toBe('WPOL');
    });

    it('returns undefined for a network without a wrapped native token', () => {
        expect(getWrappedNativeSymbol('btc')).toBeUndefined();
    });
});

describe(isWrappedNativeToken.name, () => {
    it('returns false for a network without a wrapped native token', () => {
        expect(isWrappedNativeToken('btc', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')).toBe(
            false,
        );
    });

    it('delegates supported Ethereum networks', () => {
        expect(isWrappedNativeToken('eth', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')).toBe(
            true,
        );
    });
});
