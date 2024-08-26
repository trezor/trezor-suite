import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { selectIsBitcoinOnlyDevice } from '@suite-common/wallet-core';
import { selectViewOnlyDevicesAccountsNetworkSymbols } from '@suite-native/device';
import { selectShouldShowCoinEnablingInitFlow } from '@suite-native/coin-enabling';
import {
    applyDiscoveryChangesThunk,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

export const useCoinEnablingInitialCheck = () => {
    const dispatch = useDispatch();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>>();

    const isDeviceUnlocked = useSelector(selectShouldShowCoinEnablingInitFlow);
    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);
    const viewOnlyDevicesAccountsNetworkSymbols = useSelector(
        selectViewOnlyDevicesAccountsNetworkSymbols,
    );
    const shouldShowCoinEnablingInitFlow = useSelector(selectShouldShowCoinEnablingInitFlow);
    const [isCoinEnablingActive] = useFeatureFlag(FeatureFlag.IsCoinEnablingActive);
    const wasInitScreenShown = useRef(false);

    useEffect(() => {
        if (isCoinEnablingActive && shouldShowCoinEnablingInitFlow && !wasInitScreenShown.current) {
            let timeoutId: ReturnType<typeof setTimeout>;
            //if btc only device, just run discovery for btc and do not show the UI
            if (isBitcoinOnlyDevice) {
                dispatch(setEnabledDiscoveryNetworkSymbols(['btc']));
                dispatch(setIsCoinEnablingInitFinished(true));
                dispatch(applyDiscoveryChangesThunk());
            } else {
                wasInitScreenShown.current = true;
                // if there are remembered accounts, enable its networks
                if (A.isNotEmpty(viewOnlyDevicesAccountsNetworkSymbols)) {
                    dispatch(
                        setEnabledDiscoveryNetworkSymbols(viewOnlyDevicesAccountsNetworkSymbols),
                    );
                }
                timeoutId = setTimeout(
                    () => navigation.navigate(RootStackRoutes.CoinEnablingInit),
                    4000,
                );
            }

            return () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
    }, [
        isDeviceUnlocked,
        dispatch,
        isBitcoinOnlyDevice,
        isCoinEnablingActive,
        navigation,
        viewOnlyDevicesAccountsNetworkSymbols,
        shouldShowCoinEnablingInitFlow,
    ]);
};
