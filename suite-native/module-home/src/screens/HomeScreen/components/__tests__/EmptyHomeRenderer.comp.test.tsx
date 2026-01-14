import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/wallet-core';
import {
    PreloadedState,
    getByTranslationId,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EmptyHomeRenderer } from '../EmptyHomeRenderer';

describe('EmptyHomeRenderer', () => {
    const renderEmptyHomeRenderer = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<EmptyHomeRenderer />, { preloadedState });

    const expectUninitializedConnectedDeviceState = () => {
        expect(getByTranslationId('moduleHome.emptyState.uninitializedDevice.title')).toBeTruthy();
    };

    const expectEmptyPortfolioCrossroadsState = () => {
        expect(getByTranslationId('moduleHome.emptyState.connectTrezor.description')).toBeTruthy();
    };

    const expectEmptyConnectedDeviceState = () => {
        expect(getByTranslationId('moduleHome.emptyState.emptyDevice.title')).toBeTruthy();
    };

    it('should display UninitializedConnectedDeviceState when device is connected but not initialized', async () => {
        await renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectUninitializedConnectedDeviceState();
    });

    it('should not display UninitializedConnectedDeviceState when device is connected, not initialized, but model does not support setup', async () => {
        await renderEmptyHomeRenderer({
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

    it('should display EmptyConnectedDeviceState when device is connected and authorized', async () => {
        await renderEmptyHomeRenderer({
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
