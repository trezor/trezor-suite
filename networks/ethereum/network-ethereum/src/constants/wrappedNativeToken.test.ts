import { checksumAddress, isAddress } from 'viem';

import {
    WRAPPED_NATIVE,
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
});

describe(getWrappedNativeSymbol.name, () => {
    it('returns the wrapped native symbol for a supported network', () => {
        expect(getWrappedNativeSymbol('bsc')).toBe('WBNB');
        expect(getWrappedNativeSymbol('pol')).toBe('WPOL');
    });
});

describe(isWrappedNativeToken.name, () => {
    const wethAddress = WRAPPED_NATIVE.eth.address;

    it('matches the wrapped native token regardless of case', () => {
        expect(isWrappedNativeToken('eth', wethAddress)).toBe(true);
        expect(isWrappedNativeToken('eth', wethAddress.toLowerCase())).toBe(true);
    });

    it('does not match a different token', () => {
        expect(isWrappedNativeToken('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
            false,
        );
    });

    it('returns false for a missing address', () => {
        expect(isWrappedNativeToken('eth', null)).toBe(false);
        expect(isWrappedNativeToken('eth', undefined)).toBe(false);
    });
});

describe('WRAPPED_NATIVE', () => {
    it.each(Object.entries(WRAPPED_NATIVE))('has a valid checksummed address: %s', (_, token) => {
        expect(isAddress(token.address, { strict: false })).toBe(true);
        expect(token.address).toBe(checksumAddress(token.address));
    });
});
