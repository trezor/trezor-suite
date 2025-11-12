import { getStoredState } from 'redux-persist';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { initialMigrateAppSettingsAndDiscoveryConfig } from '../../migrations/walletSettings/v1';

jest.mock('../../storage', () => ({
    initMmkvStorage: jest.fn().mockResolvedValue({}),
}));

jest.mock('redux-persist', () => ({
    getStoredState: jest.fn(),
}));

const mockGetStoredState = getStoredState as jest.MockedFunction<typeof getStoredState>;

describe(initialMigrateAppSettingsAndDiscoveryConfig.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should migrate local currency from fiatCurrencyCode', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    fiatCurrencyCode: 'czk',
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({
            localCurrency: 'czk',
        });
    });

    it('should ignore non-existent currency from fiatCurrencyCode', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    fiatCurrencyCode: 'mycoin',
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({});
    });

    it('should migrate local currency from fiatCurrency.label', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    fiatCurrency: { label: 'czk', value: 'Czech koruna' },
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({
            localCurrency: 'czk',
        });
    });

    it('should migrate bitcoin amount satoshi units', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    bitcoinUnits: PROTO.AmountUnit.SATOSHI,
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({
            bitcoinAmountUnit: 3,
        });
    });

    it('should not migrate invalid bitcoin amount units', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    bitcoinUnits: 'btc', // invalid value
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({});
    });

    it('should not migrate not implemented bitcoin amount units', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
            if (key === 'appSettings') {
                return Promise.resolve({
                    bitcoinUnits: PROTO.AmountUnit.MILLIBITCOIN,
                });
            }

            return Promise.resolve(undefined);
        });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({});
    });

    it('should migrate enabled network symbols by changing bnb to bsc and removing deprecated coins', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
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

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({
            enabledNetworks: ['btc', 'eth', 'bsc', 'test'],
        });
    });

    it('should migrate enabled network symbols but exclude unknown values', async () => {
        mockGetStoredState.mockImplementation(({ key }) => {
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

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({});

        expect(migratedState).toEqual({
            enabledNetworks: ['btc', 'eth', 'test', 'bsc'],
        });
    });

    it('should keep previous state if both appSettings and discoveryConfig are missing', async () => {
        mockGetStoredState.mockImplementation(() => Promise.resolve(undefined));

        const walletSettingsState = { someProperty: 'value' };

        const migratedState =
            await initialMigrateAppSettingsAndDiscoveryConfig(walletSettingsState);

        expect(migratedState).toEqual(walletSettingsState);
    });
});
