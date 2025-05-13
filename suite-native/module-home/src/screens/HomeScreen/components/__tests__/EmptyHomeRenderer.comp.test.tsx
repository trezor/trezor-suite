import { Action, Feature, Message } from '@suite-common/suite-types';
import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/wallet-core';
import { PreloadedState, renderWithStoreProviderAsync, screen } from '@suite-native/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EmptyHomeRenderer } from '../EmptyHomeRenderer';

describe('EmptyHomeRenderer', () => {
    const renderEmptyHomeRenderer = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<EmptyHomeRenderer />, { preloadedState });

    const expectPortfolioTrackerState = () => {
        const { getByText } = screen;

        expect(getByText('Get started')).toBeTruthy();
    };

    const expectUninitializedConnectedDeviceState = () => {
        const { getByText } = screen;

        expect(getByText('Your Trezor is ready for setup')).toBeTruthy();
    };

    const expectEmptyPortfolioCrossroadsState = () => {
        const { getByText } = screen;

        expect(getByText('Connect & unlock my Trezor')).toBeTruthy();
    };

    const expectEmptyConnectedDeviceState = () => {
        const { getByText } = screen;

        expect(getByText('Your wallet is empty')).toBeTruthy();
    };

    it('should display EmptyPortfolioTrackerState when IsDeviceConnectEnabled FF is disabled', async () => {
        await renderEmptyHomeRenderer({
            featureFlags: { isDeviceConnectEnabled: false },
            device: {
                selectedDevice: { type: 'acquired' },
                devices: [{ id: 'device_id' }],
            },
        });

        expectPortfolioTrackerState();
    });

    describe('when IsDeviceConnectEnabled FF is enabled', () => {
        it('should display UninitializedConnectedDeviceState when device is connected but not initialized', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: {
                        connected: true,
                        features: { initialized: false, internal_model: DeviceModelInternal.T2B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expectUninitializedConnectedDeviceState();
        });

        it('should not display UninitializedConnectedDeviceState when device is connected, not initialized, but device onboarding is disabled via message system.', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                messageSystem: {
                    config: {
                        version: 1,
                        timestamp: '2023-01-01',
                        sequence: 1,
                        actions: [
                            {
                                message: {
                                    id: '1',
                                    priority: 1,
                                    category: ['feature'],
                                    feature: [
                                        { domain: 'device.onboarding.mobile', flag: false },
                                    ] as Feature[],
                                } as Message,
                            } as Action,
                        ],
                        experiments: [],
                    },
                    currentSequence: 1,
                    timestamp: 0,
                    validMessages: {
                        banner: [],
                        context: [],
                        modal: [],
                        feature: ['1'],
                    },
                    dismissedMessages: {},
                    validExperiments: [],
                },
                device: {
                    selectedDevice: {
                        connected: true,
                        features: { initialized: false, internal_model: DeviceModelInternal.T2B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });

        it('should not display UninitializedConnectedDeviceState when device is connected, not initialized, but model does not support setup', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: {
                        connected: true,
                        features: { initialized: false, internal_model: DeviceModelInternal.T1B1 },
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });

        it('should display EmptyPortfolioCrossroadsState when only portfolio tracker is allowed', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: {
                        connected: false,
                        features: { initialized: true },
                        state: {},
                    },
                    devices: [{ id: PORTFOLIO_TRACKER_DEVICE_ID }],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });

        it('should display EmptyPortfolioCrossroadsState when device is not authorized', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: {
                        connected: false,
                        features: { initialized: true },
                        state: undefined,
                    },
                    devices: [{ id: 'device_id' }],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });
    });

    it('should display EmptyConnectedDeviceState when device is connected and authorized', async () => {
        await renderEmptyHomeRenderer({
            featureFlags: { isDeviceConnectEnabled: true },
            device: {
                selectedDevice: {
                    connected: true,
                    features: { initialized: true },
                    state: {},
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectEmptyConnectedDeviceState();
    });
});
