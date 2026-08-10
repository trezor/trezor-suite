import {
    createGetNetworkConfig,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import { getNetworks } from './networksConfig';
import type { NetworkSymbol } from './types';
import {
    filterNetworksByName,
    getMainnets,
    getNetworkChainId,
    getNetworksWithFeature,
    getNetworksWithNativeTokenReserve,
    getTestnets,
    isAccountBasedNetwork,
    isAccountOfNetwork,
    isNetworkUsingExternalBackend,
} from './utils';

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
const deps = { getNetworkConfig, networkModuleRepository };
const networks = getNetworks(deps);
const getNetworkFixture = (symbol: NetworkSymbol) =>
    networks.find(network => network.symbol === symbol)!;
const bitcoin = getNetworkFixture('btc');
const ethereum = getNetworkFixture('eth');
const testnet = getNetworkFixture('test');
const regtest = getNetworkFixture('regtest');
const mockNetworks = [bitcoin, ethereum, testnet, regtest];

describe(getMainnets.name, () => {
    it('returns non-testnet, non-debug-only networks when debug is false', () => {
        expect(getMainnets({ allNetworks: mockNetworks })).toEqual([bitcoin, ethereum]);
    });
});

describe(getTestnets.name, () => {
    it('returns testnet, non-debug-only networks when debug is false', () => {
        expect(getTestnets({ useTestnetNetworks: true, allNetworks: mockNetworks })).toEqual([
            testnet,
        ]);
    });

    it('includes all testnets when debug is true', () => {
        expect(
            getTestnets({ debug: true, useTestnetNetworks: true, allNetworks: mockNetworks }),
        ).toEqual([testnet, regtest]);
    });

    it('returns no testnets when testnet networks feature flag is disabled', () => {
        expect(getTestnets({ allNetworks: mockNetworks })).toEqual([]);
    });
});

describe(getNetworkChainId.name, () => {
    it('returns the configured chain ID', () => {
        expect(getNetworkChainId(deps, 'eth')).toBe(1);
    });

    it('throws when the network does not have a chain ID', () => {
        expect(() => getNetworkChainId(deps, 'btc')).toThrow(
            'Network btc does not define a chain ID.',
        );
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

    it('returns false for non-existing account types', () => {
        expect(isAccountOfNetwork(bitcoin, 'foobar')).toBe(false);
        expect(isAccountOfNetwork(ethereum, 'segwit')).toBe(false);
    });
});

describe(isAccountBasedNetwork.name, () => {
    it.each<NetworkSymbol>(['btc', 'ada'])('returns false for %s', symbol => {
        expect(isAccountBasedNetwork(deps, symbol)).toBe(false);
    });

    it.each<NetworkSymbol>(['eth', 'sol', 'hype'])('returns true for %s', symbol => {
        expect(isAccountBasedNetwork(deps, symbol)).toBe(true);
    });
});

describe(isNetworkUsingExternalBackend.name, () => {
    it.each<NetworkSymbol>([
        'bsc',
        'pol',
        'op',
        'arb',
        'base',
        'rhc',
        'hype',
        'avax',
        'sol',
        'dsol',
    ])('returns true for %s', symbol =>
        expect(isNetworkUsingExternalBackend(deps, symbol)).toBe(true),
    );

    it.each<NetworkSymbol>(['btc', 'eth', 'trx', 'xlm', 'xrp', 'ada'])(
        'returns false for %s',
        symbol => expect(isNetworkUsingExternalBackend(deps, symbol)).toBe(false),
    );
});

describe(getNetworksWithFeature.name, () => {
    it('returns string with all networks with MEV protection', () => {
        expect(getNetworksWithFeature(networks, 'mev-protection')).toBe(
            'Ethereum, BNB Smart Chain, Arbitrum One, Base',
        );
    });
});

describe(getNetworksWithNativeTokenReserve.name, () => {
    it('returns string with all networks with native token reserve', () => {
        expect(getNetworksWithNativeTokenReserve(networks)).toBe(
            'Base, Optimism, Robinhood Chain, Solana',
        );
    });
});
