import {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';

describe(getWrappedNativeToken.name, () => {
    it('returns the wrapped native token for a supported network', () => {
        expect(getWrappedNativeToken('eth')).toEqual({
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
            decimals: 18,
        });
    });

    it('returns undefined for an unsupported network', () => {
        expect(getWrappedNativeToken('btc')).toBeUndefined();
    });
});

describe(getWrappedNativeAddress.name, () => {
    it('returns the wrapped native address for a supported network', () => {
        expect(getWrappedNativeAddress('eth')).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    });

    it('returns the wrapped native address for a testnet', () => {
        expect(getWrappedNativeAddress('tsep')).toBe('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9');
    });

    it('returns undefined for an unsupported network', () => {
        expect(getWrappedNativeAddress('btc')).toBeUndefined();
    });
});

describe(getWrappedNativeSymbol.name, () => {
    it('returns the wrapped native symbol for a supported network', () => {
        expect(getWrappedNativeSymbol('bsc')).toBe('WBNB');
        expect(getWrappedNativeSymbol('pol')).toBe('WPOL');
    });

    it('returns undefined for an unsupported network', () => {
        expect(getWrappedNativeSymbol('btc')).toBeUndefined();
    });
});

describe(isWrappedNativeToken.name, () => {
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    it('matches the wrapped native token regardless of case', () => {
        expect(isWrappedNativeToken('eth', wethAddress)).toBe(true);
        expect(isWrappedNativeToken('eth', wethAddress.toLowerCase())).toBe(true);
    });

    it('does not match a different token', () => {
        expect(isWrappedNativeToken('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
            false,
        );
    });

    it('does not match on an unsupported network', () => {
        expect(isWrappedNativeToken('btc', wethAddress)).toBe(false);
    });

    it('returns false for a missing address', () => {
        expect(isWrappedNativeToken('eth', null)).toBe(false);
        expect(isWrappedNativeToken('eth', undefined)).toBe(false);
    });
});
