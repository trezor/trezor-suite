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
    const isDiscoveredDeviceAccountless = selectIsDiscoveredDeviceAccountless(state);
    const isDeviceAuthorized = selectIsDeviceAuthorized(state);
    const isDeviceUnlocked = selectIsDeviceUnlocked(state);
    const isDeviceInitialized = selectIsDeviceInitialized(state);
    const isReconnectRequested = selectIsReconnectRequested(state);

    // The reconnect requested flag is set only after the device is wiped. It indicates the old data
    // is still in Redux but the physical device is already in initialize state and ready for setup.
    const wasDeviceWiped = isReconnectRequested;

    const isEmptyStateShown =
        (isDiscoveredDeviceAccountless &&
            (isDeviceAuthorized || // Initial state: empty portfolio device that is authorized.
                !isDeviceUnlocked)) || // Device is locked (PIN not entered).
        !isDeviceInitialized ||
        wasDeviceWiped;

    if (!isEmptyStateShown) {
        return 'portfolioContent';
    }

    const isDeviceConnected = selectIsDeviceConnected(state);
    const isDeviceSetupSupported = selectIsDeviceSetupSupported(state);

    if (
        isDeviceSetupSupported &&
        isDeviceConnected &&
        (wasDeviceWiped || (!isDeviceInitialized && isDeviceUnlocked))
    ) {
        return 'uninitializedDevice';
    }

    const hasOnlyEmptyPortfolioTracker = selectHasOnlyEmptyPortfolioTracker(state);

    // Crossroads is displayed when there is no real device connected and portfolio tracker has no
    // accounts, or when a device is connected but not authorized (PIN enter cancelled).
    if (hasOnlyEmptyPortfolioTracker || !isDeviceAuthorized) {
        return 'emptyPortfolioCrossroads';
    }

    return 'emptyPortfolioTracker';
};
