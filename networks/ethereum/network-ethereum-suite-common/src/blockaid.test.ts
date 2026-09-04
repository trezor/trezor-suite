import { asNetworkChainId } from '@trezor/network-module-suite-common-types';

import { findEthereumNetworkSymbolByBlockaidChain, resolveBlockaidEvmChain } from './blockaid';

describe('resolveBlockaidEvmChain', () => {
    it.each([
        [asNetworkChainId(1), 'ethereum'],
        [asNetworkChainId(999), 'hyperevm'],
        [asNetworkChainId(4663), 'robinhood'],
        [asNetworkChainId(11155111), 'ethereum-sepolia'],
    ])('maps chainId %i to %s', (chainId, expected) => {
        expect(resolveBlockaidEvmChain(chainId)).toBe(expected);
    });

    it('defaults to Ethereum mainnet when the chainId is unknown to the payload', () => {
        expect(resolveBlockaidEvmChain(undefined)).toBe('ethereum');
    });

    it.each([
        ['Ethereum Classic', asNetworkChainId(61)],
        ['Ethereum Hoodi', asNetworkChainId(560048)],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(asNetworkChainId(1234567))).toBeNull();
    });
});

describe('findEthereumNetworkSymbolByBlockaidChain', () => {
    it('maps a Blockaid chain to the owning Ethereum network symbol', () => {
        expect(findEthereumNetworkSymbolByBlockaidChain('arbitrum')).toBe('arb');
    });

    it('returns null for an unknown Blockaid chain', () => {
        expect(findEthereumNetworkSymbolByBlockaidChain('unknown')).toBeNull();
    });
});
