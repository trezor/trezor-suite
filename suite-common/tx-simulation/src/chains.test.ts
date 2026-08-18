import { networks } from '@suite-common/wallet-config';

import { isBlockaidSupportedNetwork, resolveBlockaidEvmChain } from './chains';

describe('resolveBlockaidEvmChain', () => {
    it.each([
        [networks.eth.chainId, 'ethereum'],
        [networks.hype.chainId, 'hyperevm'],
        [networks.rhc.chainId, 'robinhood'],
        [networks.tsep.chainId, 'ethereum-sepolia'],
    ])('maps chainId %i to %s', (chainId, expected) => {
        expect(resolveBlockaidEvmChain(chainId)).toBe(expected);
    });

    it('defaults to Ethereum mainnet when the chainId is unknown to the payload', () => {
        expect(resolveBlockaidEvmChain(undefined)).toBe('ethereum');
    });

    it.each([
        ['Ethereum Classic', networks.etc.chainId],
        ['Ethereum Hoodi', networks.thod.chainId],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(1234567)).toBeNull();
    });
});

describe('isBlockaidSupportedNetwork', () => {
    it.each(['eth', 'hype', 'tsep'] as const)('supports %s', symbol => {
        expect(isBlockaidSupportedNetwork(symbol)).toBe(true);
    });

    it.each(['etc', 'thod', 'btc', 'sol'] as const)('does not support %s', symbol => {
        expect(isBlockaidSupportedNetwork(symbol)).toBe(false);
    });
});
