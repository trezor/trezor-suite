import { getStoredState } from 'redux-persist';

import { NetworkSymbol } from '@suite-common/wallet-config';

jest.mock('../../storage', () => ({
    initMmkvStorage: jest.fn().mockResolvedValue({}),
}));

jest.mock('redux-persist', () => ({
    getStoredState: jest.fn(),
}));

import { initialMigrateAppSettingsAndDiscoveryConfig } from '../../migrations/walletSettings/v1';

const mockGetStoredState = getStoredState as jest.MockedFunction<typeof getStoredState>;

describe(initialMigrateAppSettingsAndDiscoveryConfig.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should migrate enabled network symbols by changing bnb to bsc and removing deprecated coins', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    fiatCurrencyCode: 'usd',
                    bitcoinUnits: 'btc',
                });
            }
            if (key === 'discoveryConfig') {
                return Promise.resolve({
                    enabledDiscoveryNetworkSymbols: [
                        'btc',
                        'eth',
                        'nmc',
                        'bnb',
                        'test',
                        'dash',
                    ] as NetworkSymbol[],
                });
            }

            return Promise.resolve(undefined);
        });

        const walletSettingsState = {};

        const migratedState =
            await initialMigrateAppSettingsAndDiscoveryConfig(walletSettingsState);

        expect(migratedState).toEqual({
            localCurrency: 'usd',
            enabledNetworks: ['btc', 'eth', 'bsc', 'test'],
            bitcoinAmountUnit: 'btc',
        });
    });

    it('should migrate enabled network symbols but exclude unknown values', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    fiatCurrencyCode: 'usd',
                    bitcoinUnits: 'btc',
                });
            }
            if (key === 'discoveryConfig') {
                return Promise.resolve({
                    enabledDiscoveryNetworkSymbols: [
                        // invalid
                        'foo',
                        'bar',
                        // valid
                        'btc',
                        'eth',
                        'test',
                        // renamed
                        'bnb',
                        // removed
                        'nmc',
                        'dash',
                    ] as NetworkSymbol[],
                });
            }

            return Promise.resolve(undefined);
        });

        const walletSettingsState = {};

        const migratedState =
            await initialMigrateAppSettingsAndDiscoveryConfig(walletSettingsState);

        expect(migratedState).toEqual({
            localCurrency: 'usd',
            enabledNetworks: ['btc', 'eth', 'test', 'bsc'],
            bitcoinAmountUnit: 'btc',
        });
    });

    it('should return original state when appSettings or discoveryConfig is missing', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve(undefined);
            }
            if (key === 'discoveryConfig') {
                return Promise.resolve({
                    enabledDiscoveryNetworkSymbols: ['btc', 'eth'],
                });
            }

            return Promise.resolve(undefined);
        });

        const walletSettingsState = { someProperty: 'value' };

        const migratedState =
            await initialMigrateAppSettingsAndDiscoveryConfig(walletSettingsState);

        expect(migratedState).toEqual(walletSettingsState);
    });
});
