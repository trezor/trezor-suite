import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider, screen } from '@suite-native/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EmptyHomeRenderer } from '../EmptyHomeRenderer';

describe('EmptyHomeRenderer', () => {
    const renderEmptyHomeRenderer = (preloadedState: PreloadedState) =>
        renderWithStoreProvider(<EmptyHomeRenderer />, { preloadedState });

    const expectUninitializedConnectedDeviceState = () => {
        expect(
            screen.getByText(getTranslation('moduleHome.emptyState.uninitializedDevice.title')),
        ).toBeTruthy();
    };

    const expectEmptyPortfolioCrossroadsState = () => {
        expect(
            screen.getByText(getTranslation('moduleHome.emptyState.connectTrezor.description')),
        ).toBeTruthy();
    };

    const expectEmptyConnectedDeviceState = () => {
        expect(
            screen.getByText(getTranslation('moduleHome.emptyState.emptyDevice.title')),
        ).toBeTruthy();
    };

    it('should display UninitializedConnectedDeviceState when device is connected in bootloader, not initialized', () => {
        renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    mode: 'bootloader',
                    features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectUninitializedConnectedDeviceState();
    });

    it('should display UninitializedConnectedDeviceState when device is connected, authorized, not initialized', () => {
        renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    state: {},
                    features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectUninitializedConnectedDeviceState();
    });

    it('should not display EmptyPortfolioCrossroadsState when device is connected, not initialized, but model does not support setup', () => {
        renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    state: undefined,
                    features: { initialized: false, internal_model: DeviceModelInternal.T1B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectEmptyPortfolioCrossroadsState();
    });

    it('should not display EmptyPortfolioCrossroadsState when device is connected, not initialized, but not authorized', () => {
        renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectEmptyPortfolioCrossroadsState();
    });

    it('should not display EmptyPortfolioCrossroadsState when device is connected, not initialized, but thp-locked', () => {
        renderEmptyHomeRenderer({
            device: {
                selectedDevice: {
                    connected: true,
                    status: 'thp-locked',
                    features: { initialized: false, internal_model: DeviceModelInternal.T3B1 },
                },
                devices: [{ id: 'device_id' }],
            },
        });

        expectEmptyPortfolioCrossroadsState();
    });

    it('should display EmptyPortfolioCrossroadsState when only portfolio tracker is allowed', () => {
        renderEmptyHomeRenderer({
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

    it('should display EmptyPortfolioCrossroadsState when device is not authorized', () => {
        renderEmptyHomeRenderer({
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

    it('should display UninitializedConnectedDeviceState when reconnect is requested and device is initialized (happens after wipe device flow)', () => {
        renderEmptyHomeRenderer({
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

        expectUninitializedConnectedDeviceState();
    });

    it('should display EmptyConnectedDeviceState when device is connected and authorized', () => {
        renderEmptyHomeRenderer({
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
