import { networks } from '../networksConfig';
import { getMainnets, getTestnets, isAccountOfNetwork } from '../utils';

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
