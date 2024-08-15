import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import {
    selectDevice,
    selectIsPortfolioTrackerDevice,
    selectIsBitcoinOnlyDevice,
    selectIsDeviceUnlocked,
} from '@suite-common/wallet-core';
import { selectViewOnlyDevicesAccountsNetworkSymbols } from '@suite-native/device';
import { useCoinEnabling } from '@suite-native/coin-enabling';
import {
    selectIsCoinEnablingInitFinished,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

export const useCoinEnablingInitialCheck = () => {
    const dispatch = useDispatch();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>>();
    const { isCoinEnablingActive, applyDiscoveryChanges } = useCoinEnabling();
    const device = useSelector(selectDevice);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);
    const isCoinEnablingInitFinished = useSelector(selectIsCoinEnablingInitFinished);
    const viewOnlyDevicesAccountsNetworkSymbols = useSelector(
        selectViewOnlyDevicesAccountsNetworkSymbols,
    );
    const wasInitScreenShown = useRef(false);

    useEffect(() => {
        if (
            isCoinEnablingActive &&
            !isCoinEnablingInitFinished &&
            isDeviceUnlocked &&
            !!device?.connected &&
            !isPortfolioTrackerDevice &&
            !wasInitScreenShown.current
        ) {
            let timeoutId: ReturnType<typeof setTimeout>;
            //if btc only device, just run discovery and do not show the UI
            if (isBitcoinOnlyDevice) {
                dispatch(setIsCoinEnablingInitFinished(true));
                applyDiscoveryChanges();
            } else {
                wasInitScreenShown.current = true;
                // if there are remembered accounts, enable their networks
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
        applyDiscoveryChanges,
        isDeviceUnlocked,
        device?.connected,
        dispatch,
        isBitcoinOnlyDevice,
        isCoinEnablingActive,
        isCoinEnablingInitFinished,
        isPortfolioTrackerDevice,
        navigation,
        viewOnlyDevicesAccountsNetworkSymbols,
    ]);
};
