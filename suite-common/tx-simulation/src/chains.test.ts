import {
    asNetworkSymbol,
    getNetwork,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';

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
        ['Arc', getNetwork('arc').chainId],
        ['Arc Testnet', getNetwork('tarc').chainId],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(1234567)).toBeNull();
    });

    describe('with a user-added network', () => {
        const symbol = asNetworkSymbol('evm100');

        beforeEach(() => {
            registerLegacyCustomEvmNetwork({
                symbol,
                chainId: 100,
                name: 'Gnosis',
                displaySymbol: 'XDAI',
                explorerUrl: 'https://gnosisscan.io',
                testnet: false,
            });
        });

        afterEach(() => {
            unregisterLegacyNetwork(symbol);
        });

        it('passes its chain ID to Blockaid as hex', () => {
            expect(resolveBlockaidEvmChain(100)).toBe('0x64');
        });

        it('returns null again once the network is removed', () => {
            unregisterLegacyNetwork(symbol);

            expect(resolveBlockaidEvmChain(100)).toBeNull();
        });

        it('keeps a bundled chain without Blockaid support unscanned', () => {
            expect(resolveBlockaidEvmChain(getNetwork('etc').chainId)).toBeNull();
        });
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
