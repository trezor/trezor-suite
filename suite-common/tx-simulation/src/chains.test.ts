import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { getNetwork } from '@suite-common/wallet-config';

import {
    resolveBlockaidEvmChain,
    resolveBlockaidSolanaChain,
    resolveBlockaidStellarChain,
} from './chains';

const networkConfigDeps = mockNetworkConfigDeps();

describe('resolveBlockaidEvmChain', () => {
    it.each([
        [getNetwork(networkConfigDeps, 'eth').chainId, 'ethereum'],
        [getNetwork(networkConfigDeps, 'hype').chainId, 'hyperevm'],
        [getNetwork(networkConfigDeps, 'rhc').chainId, 'robinhood'],
        [getNetwork(networkConfigDeps, 'tsep').chainId, 'ethereum-sepolia'],
    ])('maps chainId %i to %s', (chainId, expected) => {
        expect(resolveBlockaidEvmChain(networkConfigDeps, chainId)).toBe(expected);
    });

    it('defaults to Ethereum mainnet when the chainId is unknown to the payload', () => {
        expect(resolveBlockaidEvmChain(networkConfigDeps, undefined)).toBe('ethereum');
    });

    it.each([
        ['Ethereum Classic', getNetwork(networkConfigDeps, 'etc').chainId],
        ['Ethereum Hoodi', getNetwork(networkConfigDeps, 'thod').chainId],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(networkConfigDeps, chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(networkConfigDeps, 1234567)).toBeNull();
    });
});

describe('resolveBlockaidSolanaChain', () => {
    it('maps Solana network symbols to Blockaid cluster names', () => {
        expect(resolveBlockaidSolanaChain('sol')).toBe('mainnet');
        expect(resolveBlockaidSolanaChain('dsol')).toBe('devnet');
    });
});

describe('resolveBlockaidStellarChain', () => {
    it('maps Stellar network symbols to Blockaid network names', () => {
        expect(resolveBlockaidStellarChain('xlm')).toBe('pubnet');
        expect(resolveBlockaidStellarChain('txlm')).toBe('testnet');
    });
});
