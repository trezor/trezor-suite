import { networks } from '../networksConfig';
import { type NetworkSymbol } from '../types';
import {
    filterNetworksByName,
    getMainnets,
    getNetworksWithMevProtection,
    getNetworksWithNativeTokenReserve,
    getTestnets,
    isAccountBasedNetwork,
    isAccountOfNetwork,
    isNetworkUsingExternalBackend,
} from '../utils';

const { btc: bitcoin, eth: ethereum, test: testnet, regtest } = networks;

const mockNetworks = [bitcoin, ethereum, testnet, regtest];

describe('Robinhood Chain network', () => {
    it('uses the expected mainnet identity and production configuration', () => {
        expect(networks.rhc).toMatchObject({
            symbol: 'rhc',
            settlementLayer: 'eth',
            chainId: 4663,
            caipId: 'eip155:4663',
            coingeckoId: 'robinhood',
            tradeCryptoId: 'robinhood--0x0000000000000000000000000000000000000000',
            displaySymbolName: 'Robinhood Ethereum',
            nativeTokenReserve: '0.0002',
            backendOptions: [{ type: 'blockbook', isExternalBackend: true }, { type: 'evm-rpc' }],
        });
        expect(networks.rhc.explorer.base).toBe('https://robinscan.io');
        expect(networks.rhc.features).not.toContain('eip1559');
        expect(networks.rhc).not.toHaveProperty('isDebugOnlyNetwork');
        expect(getMainnets({ allNetworks: [networks.rhc] })).toEqual([networks.rhc]);
    });
});

describe(getMainnets.name, () => {
    it('returns non-testnet, non-debug-only networks when debug is false', () => {
        const result = getMainnets({
            allNetworks: mockNetworks,
        });
        expect(result).toEqual([bitcoin, ethereum]);
    });
});

describe(getTestnets.name, () => {
    it('returns testnet, non-debug-only networks when debug is false', () => {
        const result = getTestnets({
            useTestnetNetworks: true,
            allNetworks: mockNetworks,
        });
        expect(result).toEqual([testnet]);
    });

    it('includes all testnets when debug is true', () => {
        const result = getTestnets({
            debug: true,
            useTestnetNetworks: true,
            allNetworks: mockNetworks,
        });
        expect(result).toEqual([testnet, regtest]);
    });

    it('returns no testnets when testnet networks feature flag is disabled', () => {
        const result = getTestnets({
            allNetworks: mockNetworks,
        });
        expect(result).toEqual([]);
    });
});

describe(filterNetworksByName.name, () => {
    it.each(['', ' ', '\t'])('returns all networks for search query "%s"', searchQuery => {
        expect(filterNetworksByName(mockNetworks, searchQuery)).toEqual(mockNetworks);
    });

    it('returns networks with name containing the search query', () => {
        expect(filterNetworksByName(mockNetworks, 'bit')).toEqual([bitcoin, testnet, regtest]);
    });

    it('returns networks with symbol containing the search query', () => {
        expect(filterNetworksByName(mockNetworks, 'BTC')).toEqual([bitcoin]);
    });
});

describe(isAccountOfNetwork.name, () => {
    test.each(mockNetworks)('returns true for "normal" accountType for network %#', network =>
        expect(isAccountOfNetwork(network, 'normal')).toBe(true),
    );

    test.each(['coinjoin', 'taproot', 'segwit', 'legacy'])(
        'returns true for "%s" from accountTypes in bitcoin',
        accountType => expect(isAccountOfNetwork(bitcoin, accountType)).toBe(true),
    );

    it('returns false for non-existing accountType in bitcoin', () => {
        expect(isAccountOfNetwork(bitcoin, 'foobar')).toBe(false);
    });

    it('returns false for non-existing accountType in ethereum', () => {
        expect(isAccountOfNetwork(ethereum, 'segwit')).toBe(false);
    });
});

describe('isAccountBasedNetwork', () => {
    it.each<NetworkSymbol>(['btc', 'ada'])('returns false for %s', symbol => {
        expect(isAccountBasedNetwork(symbol)).toBe(false);
    });

    it.each<NetworkSymbol>(['eth', 'sol'])('returns true for %s', symbol => {
        expect(isAccountBasedNetwork(symbol)).toBe(true);
    });

    it('returns throw for unknown network type', () => {
        expect(() => isAccountBasedNetwork('unknown' as NetworkSymbol)).toThrow();
    });
});

describe(isNetworkUsingExternalBackend.name, () => {
    it.each<NetworkSymbol>(['bsc', 'pol', 'op', 'arb', 'base', 'rhc', 'avax', 'sol', 'dsol'])(
        'returns true for %s',
        symbol => {
            expect(isNetworkUsingExternalBackend(symbol)).toBe(true);
        },
    );

    it.each<NetworkSymbol>(['btc', 'eth', 'trx', 'xlm', 'xrp', 'ada'])(
        'returns false for %s',
        symbol => {
            expect(isNetworkUsingExternalBackend(symbol)).toBe(false);
        },
    );
});

describe(getNetworksWithMevProtection.name, () => {
    it('returns string with all networks with MEV protection', () => {
        expect(getNetworksWithMevProtection()).toEqual(
            'Ethereum, BNB Smart Chain, Arbitrum One, Base',
        );
    });
});

describe(getNetworksWithNativeTokenReserve.name, () => {
    it('returns string with all networks with native token reserve', () => {
        expect(getNetworksWithNativeTokenReserve()).toEqual(
            'Base, Optimism, Robinhood Chain, Solana',
        );
    });
});
