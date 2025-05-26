import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryForSelectedDevice,
    selectIsDeviceUnlocked,
    selectIsPortfolioTrackerDevice,
    selectIsUnacquiredDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { DiscoveryConfigSliceRootState } from '@suite-native/discovery';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';

export const selectShouldShowCoinEnablingInitFlow = (
    state: DeviceRootState &
        DiscoveryConfigSliceRootState &
        FeatureFlagsRootState &
        DiscoveryRootState,
) => {
    const device = selectSelectedDevice(state);
    const isDeviceUnlocked = selectIsDeviceUnlocked(state);
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);
    const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(state);
    const discovery = selectDiscoveryForSelectedDevice(state);

    // NOTE: in this state, discovery threw error that no account is selected
    const isAccountsDiscoveryEmpty =
        discovery?.status === 'failed' && discovery.errorCode === 'Method_InvalidParameter';
    const isUnacquiredDevice = selectIsUnacquiredDevice(state);

    return (
        !isCoinEnablingInitFinished &&
        !!device?.connected &&
        isDeviceUnlocked &&
        !isPortfolioTrackerDevice &&
        isAccountsDiscoveryEmpty &&
        !isUnacquiredDevice
    );
};
