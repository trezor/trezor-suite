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
import { selectIsOnboardingFinished } from '@suite-native/settings';

export const useCoinEnablingInitialCheck = () => {
    const dispatch = useDispatch();

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>>();
    const [isCoinEnablingActive] = useFeatureFlag(FeatureFlag.IsCoinEnablingActive);

    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const shouldShowCoinEnablingInitFlow = useSelector(selectShouldShowCoinEnablingInitFlow);
    const viewOnlyDevicesAccountsNetworkSymbols = useSelector(
        selectViewOnlyDevicesAccountsNetworkSymbols,
    );

    const wasInitScreenShown = useRef(false);

    const canShowCoinEnablingInitFlow =
        isOnboardingFinished && isCoinEnablingActive && !wasInitScreenShown.current;

    useEffect(() => {
        if (shouldShowCoinEnablingInitFlow && canShowCoinEnablingInitFlow) {
            let timeoutId: ReturnType<typeof setTimeout>;
            //if btc only device, just run discovery for btc and do not show the UI
            if (isBitcoinOnlyDevice) {
                dispatch(setEnabledDiscoveryNetworkSymbols(['btc']));
                dispatch(setIsCoinEnablingInitFinished(true));
                dispatch(applyDiscoveryChangesThunk());
            } else {
                // if there are remembered accounts, enable its networks before showing UI
                if (A.isNotEmpty(viewOnlyDevicesAccountsNetworkSymbols)) {
                    dispatch(
                        setEnabledDiscoveryNetworkSymbols(viewOnlyDevicesAccountsNetworkSymbols),
                    );
                }
                timeoutId = setTimeout(() => {
                    wasInitScreenShown.current = true;
                    navigation.navigate(RootStackRoutes.CoinEnablingInit);
                }, 2000);
            }

            return () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
    }, [
        dispatch,
        isBitcoinOnlyDevice,
        isCoinEnablingActive,
        navigation,
        viewOnlyDevicesAccountsNetworkSymbols,
        shouldShowCoinEnablingInitFlow,
        canShowCoinEnablingInitFlow,
    ]);
};
