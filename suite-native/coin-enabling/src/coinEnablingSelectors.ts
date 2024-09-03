import {
    DeviceRootState,
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
    selectIsUnacquiredDevice,
} from '@suite-common/wallet-core';
import {
    DiscoveryConfigSliceRootState,
    selectIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';

export const selectShouldShowCoinEnablingInitFlow = (
    state: DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState,
) => {
    const device = selectDevice(state);
    const isDeviceUnlocked = selectIsDeviceUnlocked(state);
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);
    const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(state);
    const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(state);
    const isUnacquiredDevice = selectIsUnacquiredDevice(state);

    return (
        !isCoinEnablingInitFinished &&
        !!device?.connected &&
        isDeviceUnlocked &&
        !isPortfolioTrackerDevice &&
        isDeviceConnectedAndAuthorized &&
        !isUnacquiredDevice
    );
};
