import {
    DeviceRootState,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
    selectIsUnacquiredDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { DiscoveryConfigSliceRootState } from '@suite-native/discovery';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';

export const selectShouldShowCoinEnablingInitFlow = (
    state: DeviceRootState & DiscoveryConfigSliceRootState & FeatureFlagsRootState,
) => {
    const device = selectSelectedDevice(state);
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
