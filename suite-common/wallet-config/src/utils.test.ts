import { networks } from './networksConfig';
import { asNetworkSymbol } from './types';
import {
    filterNetworksByName,
    getDisplaySymbol,
    getMainnets,
    getNetworksWithMevProtection,
    getNetworksWithNativeTokenReserve,
    getTestnets,
    isAccountBasedNetwork,
    isAccountOfNetwork,
    isNetworkUsingExternalBackend,
    isSingleAccountType,
} from './utils';

const { btc: bitcoin, eth: ethereum, test: testnet, regtest, sol: solana } = networks;

const mockNetworks = [bitcoin, ethereum, testnet, regtest];

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

describe(isSingleAccountType.name, () => {
    it('returns true for solana root accountType', () => {
        expect(isSingleAccountType(solana, 'root')).toBe(true);
    });

    it.each(['normal', 'ledger'])('returns false for "%s" accountType in solana', accountType => {
        expect(isSingleAccountType(solana, accountType)).toBe(false);
    });

    it.each(['normal', 'taproot', 'segwit', 'legacy', 'coinjoin'])(
        'returns false for "%s" accountType in bitcoin',
        accountType => {
            expect(isSingleAccountType(bitcoin, accountType)).toBe(false);
        },
    );

    it('returns false for accountType unknown to the network', () => {
        expect(isSingleAccountType(ethereum, 'foobar')).toBe(false);
    });
});

describe('isAccountBasedNetwork', () => {
    it.each(['btc', 'ada'])('returns false for %s', symbol => {
        expect(isAccountBasedNetwork(asNetworkSymbol(symbol))).toBe(false);
    });

    it.each(['eth', 'sol', 'hype'])('returns true for %s', symbol => {
        expect(isAccountBasedNetwork(asNetworkSymbol(symbol))).toBe(true);
    });

    it('returns throw for unknown network type', () => {
        expect(() => isAccountBasedNetwork(asNetworkSymbol('unknown'))).toThrow();
    });
});

describe(isNetworkUsingExternalBackend.name, () => {
    it.each(['bsc', 'pol', 'op', 'arb', 'base', 'rhc', 'hype', 'avax', 'sol', 'dsol'])(
        'returns true for %s',
        symbol => {
            expect(isNetworkUsingExternalBackend(asNetworkSymbol(symbol))).toBe(true);
        },
    );

    it.each(['btc', 'eth', 'trx', 'xlm', 'xrp', 'ada'])('returns false for %s', symbol => {
        expect(isNetworkUsingExternalBackend(asNetworkSymbol(symbol))).toBe(false);
    });
});

describe(getNetworksWithMevProtection.name, () => {
    it('returns string with all networks with MEV protection', () => {
        expect(getNetworksWithMevProtection()).toEqual(
            'Ethereum, BNB Smart Chain, Arbitrum One, Base, Robinhood Chain',
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

describe(getDisplaySymbol.name, () => {
    it('returns an empty string for an empty symbol', () => {
        expect(getDisplaySymbol('')).toBe('');
    });

    it('returns the network display symbol for a native coin symbol', () => {
        expect(getDisplaySymbol('eth')).toBe('ETH');
    });

    it('returns the token symbol unchanged when it also has a contract address', () => {
        expect(getDisplaySymbol('USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')).toBe('USDC');
    });

    it('truncates symbols longer than the maximum length', () => {
        expect(getDisplaySymbol('SUPERLONGTOKEN')).toBe('SUPERLONGT...');
    });
});
