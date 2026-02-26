import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { appSettingsInitialState } from '@suite-native/settings';

import { selectDiscoverySupportedNetworks } from '../discoverySelectors';

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

// Derive the state type from the selector itself — avoids importing PreloadedState
// from @suite-native/state (which depends on this package, creating a circular dep).
type SelectorState = Parameters<typeof selectDiscoverySupportedNetworks>[0];

// Calling the selector directly with a plain state object (no Redux store) cuts the
// circular module chain: discovery → test-utils/store → state → discovery.
// The selector only reads `device.selectedDevice`, `appSettings`, and `featureFlags`.
// `selectedDevice: undefined` means all networks pass the firmware capability filter.
const createMockState = (
    overrides: {
        appSettings?: Partial<typeof appSettingsInitialState>;
        featureFlags?: Partial<typeof featureFlagsInitialState>;
    } = {},
): SelectorState =>
    ({
        device: { selectedDevice: undefined, devices: [], persistentDeviceData: [] },
        appSettings: {
            ...appSettingsInitialState,
            areTestnetsEnabled: false,
            ...overrides.appSettings,
        },
        featureFlags: {
            ...featureFlagsInitialState,
            areDebugOnlyNetworksEnabled: false,
            ...overrides.featureFlags,
        },
    }) as SelectorState;

describe('selectDiscoverySupportedNetworks', () => {
    it('should be stable (return same reference for same inputs)', () => {
        const state = createMockState();

        const firstCall = selectDiscoverySupportedNetworks(state);
        const secondCall = selectDiscoverySupportedNetworks(state);

        expect(firstCall).toBe(secondCall);
    });

    it('should filter out testnet networks when testnets are disabled', () => {
        const state = createMockState({
            appSettings: { areTestnetsEnabled: false },
        });

        const result = selectDiscoverySupportedNetworks(state);
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
        const state = createMockState({
            appSettings: { areTestnetsEnabled: true },
        });

        const result = selectDiscoverySupportedNetworks(state);
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
        const state = createMockState({
            featureFlags: { areDebugOnlyNetworksEnabled: false },
        });

        const result = selectDiscoverySupportedNetworks(state);
        const networkSymbols = result.map(n => n.symbol);

        // XLM is marked as debug-only in our mock, so it should be filtered out
        expect(networkSymbols).not.toContain('xlm');
        // Other networks should still be included
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });

    it('should include debug-only networks when debug networks feature flag is enabled', () => {
        const state = createMockState({
            featureFlags: { areDebugOnlyNetworksEnabled: true },
        });

        const result = selectDiscoverySupportedNetworks(state);
        const networkSymbols = result.map(n => n.symbol);

        // XLM should be included when debug networks are enabled
        expect(networkSymbols).toContain('xlm');
        expect(networkSymbols).toContain('btc');
        expect(networkSymbols).toContain('eth');
    });

    it('should respect forced testnet setting parameter', () => {
        const state = createMockState({
            appSettings: { areTestnetsEnabled: false },
        });

        // Force testnets enabled even though app setting is false
        const result = selectDiscoverySupportedNetworks(state, true);
        const networkSymbols = result.map(n => n.symbol);

        // Test networks should be included due to forced parameter
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
});
