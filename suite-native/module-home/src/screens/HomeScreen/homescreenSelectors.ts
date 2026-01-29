import { MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    WithSuiteSyncState,
    selectSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceStaticSessionId,
    selectHasRunningDiscovery,
    selectIsDeviceBackedUp,
    selectIsDeviceConnected,
    selectIsFirmwareUpgradable,
    selectIsPortfolioTrackerDevice,
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
        selectSuiteSyncError,
        selectIsDeviceConnected,
        (state: WithSuiteSyncState & DeviceRootState) =>
            selectSuiteSyncInteraction(state, selectDeviceStaticSessionId(state)),
    ],
    (suiteSyncError, isDeviceConnected, interactionNeeded) =>
        interactionNeeded === 'keys-needed' && (!!suiteSyncError || !isDeviceConnected),
);
