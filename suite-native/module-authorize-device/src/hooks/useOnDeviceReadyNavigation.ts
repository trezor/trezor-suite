import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';
import {
    AppTabsRoutes,
    type AuthorizeDeviceStackParamList,
    type AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

const LOADING_TIMEOUT = 2500;

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const useOnDeviceReadyNavigation = () => {
    const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const deviceEnabledDiscoveryNetworkSymbols = useSelector(
        selectDeviceEnabledDiscoveryNetworkSymbols,
    );
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const isConnectPopupOpened = useIsConnectPopupOpened();
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);

    // The connecting screen should be visible for at least 2.5 seconds before redirecting to HomeScreen.
    useEffect(() => {
        const timerId = setTimeout(() => {
            setIsTimeoutFinished(true);
        }, LOADING_TIMEOUT);

        return () => clearTimeout(timerId);
    }, [navigation]);

    // If Device is authorized and loading accounts, redirect to the Home screen.
    // If connected device has no supported networks and coin enabling init was finished,
    // also redirect to the Home screen otherwise user would be blocked forever.
    // This can happen if user enabled only COIN on device A and then connects device B which does not support COIN.
    useFocusEffect(
        useCallback(() => {
            if (isFirmwareInstallationRunning) return;

            if (
                (isDeviceReadyToUseAndAuthorized && isTimeoutFinished) ||
                (deviceEnabledDiscoveryNetworkSymbols.length === 0 && isAnyNetworkEnabled)
            ) {
                if (navigation.canGoBack() && isConnectPopupOpened) {
                    // NOTE: we don't want to go back to the home screen if Connect Popup is opened
                    navigation.goBack();

                    return;
                }
                navigation.popTo(RootStackRoutes.AppTabs, {
                    screen: AppTabsRoutes.HomeStack,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                });
            }
        }, [
            deviceEnabledDiscoveryNetworkSymbols.length,
            isAnyNetworkEnabled,
            isConnectPopupOpened,
            isDeviceReadyToUseAndAuthorized,
            isFirmwareInstallationRunning,
            isTimeoutFinished,
            navigation,
        ]),
    );
};
