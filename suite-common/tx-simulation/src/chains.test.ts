import { mockEvmNetwork } from '@suite-common/evm-networks-api/mocks';
import {
    asNetworkSymbol,
    getNetwork,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';

import {
    getNetworkByBlockaidChain,
    resolveBlockaidEvmChain,
    resolveBlockaidSolanaChain,
    resolveBlockaidStellarChain,
} from './chains';

describe(resolveBlockaidEvmChain.name, () => {
    it.each([
        [getNetwork('eth').chainId, 'ethereum'],
        [getNetwork('hype').chainId, 'hyperevm'],
        [getNetwork('rhc').chainId, 'robinhood'],
        [getNetwork('tsep').chainId, 'ethereum-sepolia'],
        [getNetwork('arc').chainId, 'arc'],
    ])('maps chainId %i to %s', (chainId, expected) => {
        expect(resolveBlockaidEvmChain(chainId)).toBe(expected);
    });

    it('defaults to Ethereum mainnet when the chainId is unknown to the payload', () => {
        expect(resolveBlockaidEvmChain(undefined)).toBe('ethereum');
    });

    it.each([
        ['Ethereum Classic', getNetwork('etc').chainId],
        ['Ethereum Hoodi', getNetwork('thod').chainId],
        ['Arc Testnet', getNetwork('tarc').chainId],
    ])('has no chain for %s', (_name, chainId) => {
        expect(resolveBlockaidEvmChain(chainId)).toBeNull();
    });

    it('returns null for a chainId Suite does not know', () => {
        expect(resolveBlockaidEvmChain(1234567)).toBeNull();
    });

    it('scans a chain the EVM networks service marks as simulated by its hex chain id', () => {
        const evmNetworks = [
            mockEvmNetwork({ chainId: 5000, simulationSupport: true }),
            mockEvmNetwork({ chainId: getNetwork('etc').chainId, simulationSupport: true }),
        ];

        expect(resolveBlockaidEvmChain(5000, evmNetworks)).toBe('0x1388');
        expect(resolveBlockaidEvmChain(getNetwork('etc').chainId, evmNetworks)).toBe('0x3d');
    });

    it('keeps the named chain of a bundled network the service also lists', () => {
        const evmNetworks = [mockEvmNetwork({ chainId: 1, simulationSupport: true })];

        expect(resolveBlockaidEvmChain(1, evmNetworks)).toBe('ethereum');
    });

    it('returns null for a chain the service lists without simulation support', () => {
        const evmNetworks = [mockEvmNetwork({ chainId: 5000, simulationSupport: false })];

        expect(resolveBlockaidEvmChain(5000, evmNetworks)).toBeNull();
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

        it('scans it even when the service lists it without simulation support', () => {
            const evmNetworks = [mockEvmNetwork({ chainId: 100, simulationSupport: false })];

            expect(resolveBlockaidEvmChain(100, evmNetworks)).toBe('0x64');
        });

        it('returns null again once the network is removed', () => {
            unregisterLegacyNetwork(symbol);

            expect(resolveBlockaidEvmChain(100)).toBeNull();
        });
    });
});

describe(getNetworkByBlockaidChain.name, () => {
    it('finds a network by its named chain', () => {
        expect(getNetworkByBlockaidChain('ethereum')?.symbol).toBe('eth');
    });

    it('finds a network by its hex chain id', () => {
        const arc = getNetwork('arc');

        expect(getNetworkByBlockaidChain(`0x${arc.chainId.toString(16)}`)?.symbol).toBe('arc');
    });

    it.each(['0xzz', '0x1zz', '0x', 'unknown-chain'])('finds nothing for %s', chain => {
        expect(getNetworkByBlockaidChain(chain)).toBeUndefined();
    });
});

describe(resolveBlockaidSolanaChain.name, () => {
    it('maps Solana network symbols to Blockaid cluster names', () => {
        expect(resolveBlockaidSolanaChain('sol')).toBe('mainnet');
        expect(resolveBlockaidSolanaChain('dsol')).toBe('devnet');
    });
});

describe(resolveBlockaidStellarChain.name, () => {
    it('maps Stellar network symbols to Blockaid network names', () => {
        expect(resolveBlockaidStellarChain('xlm')).toBe('pubnet');
        expect(resolveBlockaidStellarChain('txlm')).toBe('testnet');
    });
});
