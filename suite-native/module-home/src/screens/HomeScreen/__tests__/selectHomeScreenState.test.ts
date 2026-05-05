import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { createStoreFromPreloadedState } from '@suite-native/test-utils-store';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectHomeScreenState } from '../homescreenSelectors';

const TEST_SESSION_ID = 'address@hash:0' as const;

const buildState = (preloadedState: Record<string, unknown>) =>
    createStoreFromPreloadedState(preloadedState).getState() as Parameters<
        typeof selectHomeScreenState
    >[0];

describe('selectHomeScreenState', () => {
    describe('portfolioContent', () => {
        it('should return portfolioContent when device is connected, authorized and has accounts', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        state: { staticSessionId: TEST_SESSION_ID },
                        features: { initialized: true },
                    },
                    devices: [{ id: 'device_id' }],
                },
                wallet: {
                    settings: { enabledNetworks: ['btc'] },
                    accounts: [{ deviceState: TEST_SESSION_ID, visible: true }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('portfolioContent');
        });
    });

    describe('uninitializedDevice', () => {
        it('should return uninitializedDevice when device is connected in bootloader and not initialized', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        mode: 'bootloader',
                        features: {
                            initialized: false,
                            unlocked: true,
                            internal_model: DeviceModelInternal.T3B1,
                        },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('uninitializedDevice');
        });

        it('should return uninitializedDevice when device is connected, authorized, unlocked and not initialized', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        state: {},
                        features: {
                            initialized: false,
                            unlocked: true,
                            internal_model: DeviceModelInternal.T3B1,
                        },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('uninitializedDevice');
        });

        it('should return uninitializedDevice when reconnect is requested after wipe device flow', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        reconnectRequested: true,
                        features: {
                            initialized: true,
                            internal_model: DeviceModelInternal.T3B1,
                            major_version: 2,
                            minor_version: 6,
                            patch_version: 3,
                        },
                        state: {},
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('uninitializedDevice');
        });
    });

    describe('emptyPortfolioCrossroads', () => {
        it('should return emptyPortfolioCrossroads when device is connected, not initialized, but model does not support setup', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        state: undefined,
                        features: { initialized: false, internal_model: DeviceModelInternal.T1B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioCrossroads');
        });

        it('should return emptyPortfolioCrossroads when device is connected, not initialized and not authorized', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioCrossroads');
        });

        it('should return emptyPortfolioCrossroads when device is connected, not initialized and thp-locked', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        status: 'thp-locked',
                        features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioCrossroads');
        });

        it('should return emptyPortfolioCrossroads when only portfolio tracker is present', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: false,
                        features: { initialized: true },
                        state: {},
                    },
                    devices: [{ id: PORTFOLIO_TRACKER_DEVICE_ID }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioCrossroads');
        });

        it('should return emptyPortfolioCrossroads when device is not authorized', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: false,
                        features: { initialized: true },
                        state: undefined,
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioCrossroads');
        });
    });

    describe('noNetworkConfigured', () => {
        it('should return noNetworkConfigured when device is connected, initialized and not authorized', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        connected: true,
                        features: { initialized: true },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expect(selectHomeScreenState(state)).toBe('noNetworkConfigured');
        });
    });

    describe('emptyPortfolioTracker', () => {
        it('should return emptyPortfolioTracker when portfolio tracker is selected alongside a real device', () => {
            const state = buildState({
                device: {
                    selectedDevice: {
                        id: PORTFOLIO_TRACKER_DEVICE_ID,
                        connected: false,
                        features: { initialized: true },
                        state: {},
                    },
                    devices: [{ id: 'real_device_id' }, { id: PORTFOLIO_TRACKER_DEVICE_ID }],
                },
                wallet: {
                    settings: { enabledNetworks: ['btc'] },
                },
            });

            expect(selectHomeScreenState(state)).toBe('emptyPortfolioTracker');
        });
    });
});
