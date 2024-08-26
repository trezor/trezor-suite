import {
    DeviceRootState,
    selectDevice,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
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

    return (
        !isCoinEnablingInitFinished &&
        !!device?.connected &&
        isDeviceUnlocked &&
        !isPortfolioTrackerDevice
    );
};
