import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    selectEnabledDiscoveryNetworkSymbols,
    selectDiscoverySupportedNetworks,
    discoveryCheckThunk,
} from '@suite-native/discovery';
import { disableAccountsThunk } from '@suite-common/wallet-core';

export const useCoinEnabling = () => {
    const [isCoinEnablingActive] = useFeatureFlag(FeatureFlag.IsCoinEnablingActive);
    const dispatch = useDispatch();

    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);

    const applyDiscoveryChanges = useCallback(() => {
        // remove disabled networks accounts
        dispatch(disableAccountsThunk());
        // check whether to start discovery and start if needed
        dispatch(discoveryCheckThunk());
    }, [dispatch]);

    return {
        isCoinEnablingActive,
        enabledNetworkSymbols,
        availableNetworks,
        applyDiscoveryChanges,
    };
};
