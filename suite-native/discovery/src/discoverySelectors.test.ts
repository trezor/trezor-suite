import { type StateFromReducersMapObject } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { accountsInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { appSettingsInitialState } from '@suite-native/settings';
import {
    type PreloadedStatePartial,
    createLightStore,
    createStaticReducer,
} from '@suite-native/test-utils-store';

import {
    selectDiscoveryNetworkGroups,
    selectDiscoverySupportedNetworks,
} from './discoverySelectors';

const btcNetwork = getNetwork(asNetworkSymbol('btc'));
const testNetwork = getNetwork(asNetworkSymbol('test'));
const regtestNetwork = getNetwork(asNetworkSymbol('regtest'));
const ethNetwork = getNetwork(asNetworkSymbol('eth'));
const tsepNetwork = getNetwork(asNetworkSymbol('tsep'));

// Mock the dependencies
jest.mock('@suite-native/config', () => ({
    ...jest.requireActual('@suite-native/config'),
    isDetoxTestBuild: jest.fn(() => false),
}));

jest.mock('@suite-common/wallet-config', () => ({
    ...jest.requireActual('@suite-common/wallet-config'),
    getNetwork: jest.fn((symbol: string) => ({
        symbol,
        isDebugOnlyNetwork: symbol === 'xlm',
        isHidden: false,
    })),
}));

const reducer = {
    appSettings: createStaticReducer(appSettingsInitialState),
    device: createStaticReducer(deviceInitialState),
    featureFlags: createStaticReducer(featureFlagsInitialState),
    wallet: createStaticReducer({
        accounts: accountsInitialState,
        settings: initialWalletSettingsState,
    }),
} as const;

const createMockState = (
    overrides: PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>> = {},
): StateFromReducersMapObject<typeof reducer> => ({
    appSettings: {
        ...appSettingsInitialState,
        ...overrides.appSettings,
    },
    device: {
        ...deviceInitialState,
        selectedDevice: overrides.device?.selectedDevice as TrezorDevice,
    },
    featureFlags: {
        ...featureFlagsInitialState,
        ...overrides.featureFlags,
    },
    wallet: {
        accounts: overrides.wallet?.accounts ?? accountsInitialState,
        settings: {
            ...initialWalletSettingsState,
            ...overrides.wallet?.settings,
        },
    },
});

const createTestStore = (
    overrides?: PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>>,
) =>
    createLightStore({
        reducer,
        preloadedState: createMockState(overrides),
    });

describe('selectDiscoverySupportedNetworks', () => {
    it('should be stable (return same reference for same inputs)', () => {
        const store = createTestStore();

        const firstCall = selectDiscoverySupportedNetworks(store.getState());
        const secondCall = selectDiscoverySupportedNetworks(store.getState());

        expect(firstCall).toBe(secondCall);
    });

    it('should filter out testnet networks when testnets are disabled', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: false },
        });

        const result = selectDiscoverySupportedNetworks(store.getState());
        const networkSymbols = result.map(n => n.symbol);

        // Test networks should be filtered out
        expect(networkSymbols).not.toContain('test');
        expect(networkSymbols).not.toContain('tsep');
        expect(networkSymbols).not.toContain('thod');
        expect(networkSymbols).not.toContain('txrp');
        expect(networkSymbols).not.toContain('txlm');
        expect(networkSymbols).not.toContain('dsol');
        // Mainnet networks should still be included
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });

    it('should include testnet networks when testnets are enabled', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: true },
        });

        const result = selectDiscoverySupportedNetworks(store.getState());
        const networkSymbols = result.map(n => n.symbol);

        // Test networks should be included
        expect(networkSymbols).toContain('test');
        expect(networkSymbols).toContain('tsep');
        expect(networkSymbols).toContain('thod');
        expect(networkSymbols).toContain('txrp');
        expect(networkSymbols).toContain('txlm');
        expect(networkSymbols).toContain('dsol');
        // Mainnet networks should also be included
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });

    it('should filter out debug-only networks when debug networks feature flag is disabled', () => {
        const store = createTestStore({
            featureFlags: { areDebugOnlyNetworksEnabled: false },
        });

        const result = selectDiscoverySupportedNetworks(store.getState());
        const networkSymbols = result.map(n => n.symbol);

        // XLM is marked as debug-only in our mock, so it should be filtered out
        expect(networkSymbols).not.toContain('xlm');
        // Other networks should still be included
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });

    it('should include debug-only networks when debug networks feature flag is enabled', () => {
        const store = createTestStore({
            featureFlags: { areDebugOnlyNetworksEnabled: true },
        });

        const result = selectDiscoverySupportedNetworks(store.getState());
        const networkSymbols = result.map(n => n.symbol);

        // XLM should be included when debug networks are enabled
        expect(networkSymbols).toContain('xlm');
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });
});

describe(selectDiscoveryNetworkGroups.name, () => {
    it('return only mainnets when testnets networks feature flag is disabled', () => {
        const store = createTestStore();

        const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
            selectDiscoveryNetworkGroups(store.getState());

        expect(supportedMainnets).toContain(btcNetwork);
        expect(supportedTestnets).toEqual([]);
        expect(unsupportedMainnets).toEqual([]);
        expect(unsupportedTestnets).toEqual([]);
    });

    it('returns testnets when testnets networks feature flag is enabled', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: true },
        });

        const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
            selectDiscoveryNetworkGroups(store.getState());

        expect(supportedMainnets).toContain(btcNetwork);
        expect(supportedTestnets).toContain(testNetwork);
        expect(supportedTestnets).not.toContain(regtestNetwork);
        expect(unsupportedMainnets).toEqual([]);
        expect(unsupportedTestnets).toEqual([]);
    });

    it('returns also debug-only testnets when testnet+debug-only networks feature flags are enabled', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: true },
            featureFlags: { areDebugOnlyNetworksEnabled: true },
        });

        const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
            selectDiscoveryNetworkGroups(store.getState());

        expect(supportedMainnets).toContain(btcNetwork);
        expect(supportedTestnets).toContain(testNetwork);
        expect(supportedTestnets).toContain(regtestNetwork);
        expect(unsupportedMainnets).toEqual([]);
        expect(unsupportedTestnets).toEqual([]);
    });

    it('returns both supported and unsupported networks based on device unavailable capabilities', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: true },
            featureFlags: { areDebugOnlyNetworksEnabled: true },
            device: {
                selectedDevice: {
                    unavailableCapabilities: { eth: 'no-support', tsep: 'no-support' },
                },
            },
        });

        const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
            selectDiscoveryNetworkGroups(store.getState());

        expect(supportedMainnets).toContain(btcNetwork);
        expect(supportedTestnets).toContain(testNetwork);
        expect(unsupportedMainnets).toContain(ethNetwork);
        expect(unsupportedTestnets).toContain(tsepNetwork);
    });

    it('returns both supported and unsupported networks filtered by searchQuery', () => {
        const store = createTestStore({
            appSettings: { areTestnetsEnabled: true },
            featureFlags: { areDebugOnlyNetworksEnabled: true },
            device: {
                selectedDevice: {
                    unavailableCapabilities: { eth: 'no-support', tsep: 'no-support' },
                },
            },
        });

        const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
            selectDiscoveryNetworkGroups(store.getState(), 'bitcoin');

        expect(supportedMainnets).toContain(btcNetwork);
        expect(supportedTestnets).toContain(testNetwork);
        expect(supportedTestnets).toContain(regtestNetwork);
        expect(unsupportedMainnets).toEqual([]);
        expect(unsupportedTestnets).toEqual([]);
    });
});
