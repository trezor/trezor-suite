import { getStoredState } from 'redux-persist';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { initialMigrateAppSettingsAndDiscoveryConfig } from '../../migrations/walletSettings/v1';
import { createMMKVStorageMock } from '../../mmkvStorage.mock';

describe(initialMigrateAppSettingsAndDiscoveryConfig.name, () => {
    it('should migrate local currency from fiatCurrencyCode', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        fiatCurrencyCode: 'czk',
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({
            localCurrency: 'czk',
        });
    });

    it('should ignore non-existent currency from fiatCurrencyCode', async () => {
        const mockGetStoreState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        fiatCurrencyCode: 'mycoin',
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoreState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({});
    });

    it('should migrate local currency from fiatCurrency.label', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        fiatCurrency: { label: 'czk', value: 'Czech koruna' },
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({
            localCurrency: 'czk',
        });
    });

    it('should migrate bitcoin amount satoshi units', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        bitcoinUnits: PROTO.AmountUnit.SATOSHI,
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({
            bitcoinAmountUnit: 3,
        });
    });

    it('should not migrate invalid bitcoin amount units', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        bitcoinUnits: 'btc', // invalid value
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({});
    });

    it('should not migrate not implemented bitcoin amount units', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
                if (key === 'appSettings') {
                    return Promise.resolve({
                        bitcoinUnits: PROTO.AmountUnit.MILLIBITCOIN,
                    });
                }

                return Promise.resolve(undefined);
            });

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({});
    });

    it('should migrate enabled network symbols by changing bnb to bsc and removing deprecated coins', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
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

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({
            enabledNetworks: ['btc', 'eth', 'bsc', 'test'],
        });
    });

    it('should migrate enabled network symbols but exclude unknown values', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(({ key }) => {
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

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })({});

        expect(migratedState).toEqual({
            enabledNetworks: ['btc', 'eth', 'test', 'bsc'],
        });
    });

    it('should keep previous state if both appSettings and discoveryConfig are missing', async () => {
        const mockGetStoredState = jest
            .fn<ReturnType<typeof getStoredState>, Parameters<typeof getStoredState>>()
            .mockImplementation(() => Promise.resolve(undefined));

        const walletSettingsState = { someProperty: 'value' };

        const migratedState = await initialMigrateAppSettingsAndDiscoveryConfig({
            getStoredState: mockGetStoredState,
            mmkvStorage: createMMKVStorageMock(),
        })(walletSettingsState);

        expect(migratedState).toEqual(walletSettingsState);
    });
});
