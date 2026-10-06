import { getNetwork } from '@suite-common/wallet-config';

import {
    resolveBlockaidEvmChain,
    resolveBlockaidSolanaChain,
    resolveBlockaidStellarChain,
} from './chains';

describe('resolveBlockaidEvmChain', () => {
    it.each([
        [getNetwork('eth').chainId, 'ethereum'],
        [getNetwork('hype').chainId, 'hyperevm'],
        [getNetwork('rhc').chainId, 'robinhood'],
        [getNetwork('tsep').chainId, 'ethereum-sepolia'],
    ])('maps chainId %i to %s', (chainId, expected) => {
        expect(resolveBlockaidEvmChain(chainId)).toBe(expected);
    });

    it('defaults to Ethereum mainnet when the chainId is unknown to the payload', () => {
        expect(resolveBlockaidEvmChain(undefined)).toBe('ethereum');
    });

    it.each([
        ['Ethereum Classic', getNetwork('etc').chainId],
        ['Ethereum Hoodi', getNetwork('thod').chainId],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(1234567)).toBeNull();
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
