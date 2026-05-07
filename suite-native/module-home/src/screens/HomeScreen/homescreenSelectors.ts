import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectIsDeviceAuthorized,
    selectIsDeviceBackedUp,
    selectIsDeviceConnected,
    selectIsDeviceInitialized,
    selectIsDeviceUnlocked,
    selectIsFirmwareUpgradable,
    selectIsPortfolioTrackerDevice,
    selectIsReconnectRequested,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type WithSuiteSyncState,
    selectHasDeviceSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import {
    type DiscoveryRootState,
    selectHasOnlyEmptyPortfolioTracker,
    selectHasRunningDiscovery,
    selectIsAnyNetworkEnabled,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import { type NativeDeviceRootState, selectIsDeviceSetupSupported } from '@suite-native/device';
import { selectIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';

import { type HomeScreenState } from './homescreenTypes';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState & DiscoveryRootState & WithSuiteSyncState & MessageSystemRootState
>();

export const selectShouldDisplayUpgradeFirmwareAlert = createMemoizedSelector(
    [
        selectIsFirmwareUpgradable,
        selectShouldOfferUpdateFirmware,
        selectIsPortfolioTrackerDevice,
        selectHasRunningDiscovery,
        selectIsDeviceConnected,
        selectIsDeviceBackedUp,
        selectIsFirmwareUpdateFeatureEnabled,
    ],
    (
        isFirmwareUpgradable,
        shouldOfferUpdateFirmware,
        isPortfolioTracker,
        isDiscoveryRunning,
        isDeviceConnected,
        isDeviceBackedUp,
        isFirmwareUpdateFeatureEnabled,
    ) =>
        isFirmwareUpgradable &&
        shouldOfferUpdateFirmware &&
        !isPortfolioTracker &&
        !isDiscoveryRunning &&
        isDeviceConnected &&
        isDeviceBackedUp &&
        isFirmwareUpdateFeatureEnabled,
);

export const selectShouldDisplaySuiteSyncAlert = createMemoizedSelector(
    [
        (state: WithSuiteSyncState & DeviceRootState) =>
            selectHasDeviceSuiteSyncError(state, selectDeviceStaticSessionId(state)),
        selectIsDeviceConnected,
        (state: WithSuiteSyncState & DeviceRootState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, selectDeviceStaticSessionId(state)),
    ],
    (hasSuiteSyncError, isDeviceConnected, interactionNeeded) =>
        interactionNeeded === 'keys-needed' && (hasSuiteSyncError || !isDeviceConnected),
);

export const selectShouldDisplaySuiteSyncFirmwareUpdateAlert = createMemoizedSelector(
    [
        (state: WithSuiteSyncState & DeviceRootState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, selectDeviceStaticSessionId(state)),
    ],
    interactionNeeded => interactionNeeded === 'firmware-upgrade-needed',
);

export const selectHomeScreenState = (state: NativeDeviceRootState): HomeScreenState => {
    const isDeviceConnected = selectIsDeviceConnected(state);
    const isDeviceUnlocked = selectIsDeviceUnlocked(state);
    const isDeviceAuthorized = selectIsDeviceAuthorized(state);
    const isDeviceSetupSupported = selectIsDeviceSetupSupported(state);
    const isDeviceInitialized = selectIsDeviceInitialized(state);
    const isReconnectRequested = selectIsReconnectRequested(state);
    const isAnyNetworkEnabled = selectIsAnyNetworkEnabled(state);
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);
    const hasOnlyEmptyPortfolioTracker = selectHasOnlyEmptyPortfolioTracker(state);
    const isDiscoveredDeviceAccountless = selectIsDiscoveredDeviceAccountless(state);
    const hasRunningDiscovery = selectHasRunningDiscovery(state);

    // Crossroads is displayed either when there is no real device connected and the portfolio tracker
    // has no accounts, or when a device is connected but PIN entry or THP confirmation was canceled.
    if (hasOnlyEmptyPortfolioTracker || (!isDeviceUnlocked && !isDeviceAuthorized)) {
        return 'emptyPortfolioCrossroads';
    }

    if (isPortfolioTrackerDevice && isDiscoveredDeviceAccountless) {
        return 'emptyPortfolioTracker';
    }

    if (isDeviceConnected) {
        // The isReconnectRequested flag is set only after the device is wiped. It indicates that old data
        // is still in Redux but the physical device is already in initialize state and ready for setup.
        if (isDeviceSetupSupported && (!isDeviceInitialized || isReconnectRequested)) {
            return 'uninitializedDevice';
        }

        if (isDeviceInitialized && !isAnyNetworkEnabled) {
            return 'noNetworkConfigured';
        }
    }

    if (isDiscoveredDeviceAccountless && !hasRunningDiscovery) {
        return 'discoveryNotFinished';
    }

    return 'portfolioContent';
};
