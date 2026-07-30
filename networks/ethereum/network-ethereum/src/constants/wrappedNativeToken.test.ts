import { checksumAddress, isAddress } from 'viem';

import { asNetworkSymbol } from '@trezor/network-module';
import {
    WRAPPED_NATIVE,
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    isWrappedNativeToken,
} from './wrappedNativeToken';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe(getWrappedNativeAddress.name, () => {
    it('returns the wrapped native address for a supported network', () => {
        expect(getWrappedNativeAddress(ethSymbol)).toBe(
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        );
    });

    it('returns the wrapped native address for a testnet', () => {
        expect(getWrappedNativeAddress(asNetworkSymbol('tsep'))).toBe(
            '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
        );
    });

    it('returns undefined for a network without a wrapped native token', () => {
        expect(getWrappedNativeAddress(btcSymbol)).toBeUndefined();
    });
});

describe(getWrappedNativeSymbol.name, () => {
    it('returns the wrapped native symbol for a supported network', () => {
        expect(getWrappedNativeSymbol(asNetworkSymbol('bsc'))).toBe('WBNB');
        expect(getWrappedNativeSymbol(asNetworkSymbol('pol'))).toBe('WPOL');
    });

    it('returns undefined for a network without a wrapped native token', () => {
        expect(getWrappedNativeSymbol(btcSymbol)).toBeUndefined();
    });
});

describe(isWrappedNativeToken.name, () => {
    const wethAddress = WRAPPED_NATIVE.eth.address;

    it('matches the wrapped native token regardless of case', () => {
        expect(isWrappedNativeToken(ethSymbol, wethAddress)).toBe(true);
        expect(isWrappedNativeToken(ethSymbol, wethAddress.toLowerCase())).toBe(true);
    });

    it('does not match a different token', () => {
        expect(isWrappedNativeToken(ethSymbol, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
            false,
        );
    });

    it('does not match on a network without a wrapped native token', () => {
        expect(isWrappedNativeToken(btcSymbol, wethAddress)).toBe(false);
    });

    it('returns false for a missing address', () => {
        expect(isWrappedNativeToken(ethSymbol, null)).toBe(false);
        expect(isWrappedNativeToken(ethSymbol, undefined)).toBe(false);
    });
});

describe('WRAPPED_NATIVE', () => {
    it.each(Object.entries(WRAPPED_NATIVE))('has a valid checksummed address: %s', (_, token) => {
        expect(isAddress(token.address, { strict: false })).toBe(true);
        expect(token.address).toBe(checksumAddress(token.address));
    });
});
