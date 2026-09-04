import { resolveBlockaidSolanaChain, resolveBlockaidStellarChain } from './chains';

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
