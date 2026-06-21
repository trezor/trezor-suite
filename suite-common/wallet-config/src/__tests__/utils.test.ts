import { networks } from '../networksConfig';
import { type NetworkSymbol } from '../types';
import {
    getMainnets,
    getTestnets,
    isAccountBasedNetwork,
    isAccountOfNetwork,
    isNetworkUsingExternalBackend,
} from '../utils';

const { btc: bitcoin, eth: ethereum, test: testnet, regtest } = networks;

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
    it.each<NetworkSymbol>(['bsc', 'pol', 'op', 'arb', 'base', 'avax', 'sol', 'dsol'])(
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
