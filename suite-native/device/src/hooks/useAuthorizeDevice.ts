import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectDeviceRequestedPin,
    selectIsDeviceUnlocked,
    selectIsNoPhysicalDeviceConnected,
} from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

import { selectIsDeviceReadyToUseAndAuthorized } from '../selectors';

const LOADING_TIMEOUT = 2500;

type NavigationProp = StackToTabCompositeProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.PinMatrix,
    RootStackParamList
>;

export const useAuthorizeDevice = () => {
    const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);

    // The connecting screen should be visible for at least 2.5 seconds before redirecting to HomeScreen.
    useEffect(() => {
        const timerId = setTimeout(() => {
            setIsTimeoutFinished(true);
        }, LOADING_TIMEOUT);

        return () => clearTimeout(timerId);
    }, [navigation]);

    // If device requests PIN, redirect to the PinMatrix screen.
    useEffect(() => {
        if (hasDeviceRequestedPin && !isDeviceUnlocked) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.PinMatrix,
            });
        }
    }, [hasDeviceRequestedPin, isDeviceUnlocked, navigation]);

    // If Device is authorized and loading accounts, redirect to the Home screen.
    useEffect(() => {
        if (isDeviceReadyToUseAndAuthorized && isTimeoutFinished) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [
        isDeviceReadyToUseAndAuthorized,
        isNoPhysicalDeviceConnected,
        isTimeoutFinished,
        navigation,
    ]);

    useEffect(() => {
        // Connect doesn't have an event for correct pin entry,
        // but we can subscribe to this property change instead
        // which gets changed after succesfull auth
        if (isDeviceUnlocked) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [isDeviceUnlocked, navigation]);
};
