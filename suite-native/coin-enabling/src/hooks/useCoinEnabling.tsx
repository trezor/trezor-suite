import { useSelector } from 'react-redux';

import { FeatureFlag, FeatureFlagsRootState, useFeatureFlag } from '@suite-native/feature-flags';
import {
    selectAreTestnetsEnabled,
    selectEnabledDiscoveryNetworkSymbols,
    selectDiscoverySupportedNetworks,
    DiscoveryConfigSliceRootState,
} from '@suite-native/discovery';
import { DeviceRootState } from '@suite-common/wallet-core';

export const useCoinEnabling = () => {
    const [isCoinEnablingActive] = useFeatureFlag(FeatureFlag.IsCoinEnablingActive);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const availableNetworks = useSelector((state: DeviceRootState) =>
        selectDiscoverySupportedNetworks(state, areTestnetsEnabled),
    );
    const enabledNetworkSymbols = useSelector(
        (state: DiscoveryConfigSliceRootState & DeviceRootState & FeatureFlagsRootState) =>
            selectEnabledDiscoveryNetworkSymbols(state, areTestnetsEnabled),
    );

    const applyDiscoveryChanges = () => {
        // TODO: remove disabled network accounts and run discovery check
    };

    return {
        isCoinEnablingActive,
        enabledNetworkSymbols,
        availableNetworks,
        applyDiscoveryChanges,
    };
};
