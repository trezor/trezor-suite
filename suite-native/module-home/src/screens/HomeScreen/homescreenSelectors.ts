import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectIsDeviceBackedUp,
    selectIsDeviceConnected,
    selectIsFirmwareUpgradable,
    selectIsPortfolioTrackerDevice,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type WithSuiteSyncState,
    selectHasDeviceSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { type DiscoveryRootState, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { selectIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';

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
        (state: WithSuiteSyncState & DeviceRootState) =>
            selectSuiteSyncInteraction(state, selectDeviceStaticSessionId(state)),
    ],
    (hasSuiteSyncError, isDeviceConnected, interactionNeeded) =>
        interactionNeeded === 'keys-needed' && (hasSuiteSyncError || !isDeviceConnected),
);

export const selectShouldDisplaySuiteSyncFirmwareUpdateAlert = createMemoizedSelector(
    [
        (state: WithSuiteSyncState & DeviceRootState) =>
            selectSuiteSyncInteraction(state, selectDeviceStaticSessionId(state)),
    ],
    interactionNeeded => interactionNeeded === 'firmware-upgrade-needed',
);
