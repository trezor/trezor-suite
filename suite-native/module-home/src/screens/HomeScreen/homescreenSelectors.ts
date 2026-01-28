import { MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    WithSuiteSyncState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncError,
} from '@suite-common/suite-sync';
import {
    DeviceRootState,
    DiscoveryRootState,
    selectHasRunningDiscovery,
    selectIsDeviceBackedUp,
    selectIsDeviceConnected,
    selectIsFirmwareUpgradable,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevicesOwnerId,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/wallet-core';
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
        selectSelectedDevicesOwnerId,
        selectIsSuiteSyncEnabled,
        selectSuiteSyncError,
        selectIsDeviceConnected,
    ],
    (deviceOwnerId, isSuiteSyncEnabled, suiteSyncError, isDeviceConnected) =>
        !deviceOwnerId && isSuiteSyncEnabled && (!!suiteSyncError || !isDeviceConnected),
);
