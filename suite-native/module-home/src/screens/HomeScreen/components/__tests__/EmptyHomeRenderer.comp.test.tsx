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

        expect(getByText('Connect your Trezor')).toBeTruthy();
    };

    const expectEmptyConnectedDeviceState = () => {
        const { getByText } = screen;

        expect(getByText('Your wallet is empty')).toBeTruthy();
    };

    it('should display EmptyPortfolioTrackerState when IsDeviceConnectEnabled FF is disabled', async () => {
        await renderEmptyHomeRenderer({
            featureFlags: { isDeviceConnectEnabled: false },
            device: {
                selectedDevice: 'a',
                devices: [{ type: 'acquired', path: 'a' }, { id: 'device_id' }],
            },
        });

        expectPortfolioTrackerState();
    });

    describe('when IsDeviceConnectEnabled FF is enabled', () => {
        it('should display UninitializedConnectedDeviceState when device is connected but not initialized', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: 'a',
                    devices: [
                        {
                            id: 'a',
                            connected: true,
                            features: {
                                device_id: 'a',
                                initialized: false,
                                internal_model: DeviceModelInternal.T3B1,
                            },
                        },
                        { id: 'device_id' },
                    ],
                },
            });

            expectUninitializedConnectedDeviceState();
        });

        it('should not display UninitializedConnectedDeviceState when device is connected, not initialized, but model does not support setup', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: 'a',
                    devices: [
                        {
                            id: 'a',
                            connected: true,
                            features: {
                                initialized: false,
                                internal_model: DeviceModelInternal.T1B1,
                                device_id: 'a',
                            },
                        },
                        { id: 'device_id' },
                    ],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });

        it('should display EmptyPortfolioCrossroadsState when only portfolio tracker is allowed', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: 'PORTFOLIO_TRACKER_DEVICE_ID',
                    devices: [{ id: PORTFOLIO_TRACKER_DEVICE_ID }],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });

        it('should display EmptyPortfolioCrossroadsState when device is not authorized', async () => {
            await renderEmptyHomeRenderer({
                featureFlags: { isDeviceConnectEnabled: true },
                device: {
                    selectedDevice: 'a',
                    devices: [
                        {
                            connected: false,
                            features: { initialized: true, device_id: 'a' },
                            state: undefined,
                            id: 'a',
                        },
                        { id: 'device_id' },
                    ],
                },
            });

            expectEmptyPortfolioCrossroadsState();
        });
    });

    it('should display EmptyConnectedDeviceState when device is connected and authorized', async () => {
        await renderEmptyHomeRenderer({
            featureFlags: { isDeviceConnectEnabled: true },
            device: {
                selectedDevice: 'a',
                devices: [
                    {
                        connected: true,
                        features: { initialized: true, device_id: 'a' },
                        state: {},
                        id: 'a',
                    },
                    { id: 'device_id' },
                ],
            },
        });

        expectEmptyConnectedDeviceState();
    });
});
