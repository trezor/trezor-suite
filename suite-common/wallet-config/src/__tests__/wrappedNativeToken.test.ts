import { checksumAddress, isAddress } from 'viem';

import { typedObjectKeys } from '@trezor/utils';

import { getNetworkType } from '../utils';
import {
    WRAPPED_NATIVE,
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
} from '../wrappedNativeToken';

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

describe('WRAPPED_NATIVE', () => {
    it('only maps EVM (ethereum) networks', () => {
        typedObjectKeys(WRAPPED_NATIVE).forEach(networkSymbol => {
            expect(getNetworkType(networkSymbol)).toBe('ethereum');
        });
    });

    it.each(Object.entries(WRAPPED_NATIVE))('has a valid checksummed address: %s', (_, token) => {
        expect(isAddress(token.address, { strict: false })).toBe(true);
        expect(token.address).toBe(checksumAddress(token.address));
    });
});
