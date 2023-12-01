import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';

import {
    selectDeviceRequestedPin,
    selectIsDeviceUnlocked,
    selectIsNoPhysicalDeviceConnected,
} from '@suite-common/wallet-core';
import {
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '@suite-native/navigation';

import { selectIsDeviceReadyToUseAndAuthorized } from '../selectors';

const LOADING_TIMEOUT = 2500;

export const useAuthorizeDevice = () => {
    const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
    const navigation = useNavigation();

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
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.ConnectDevice,
                            params: {
                                screen: ConnectDeviceStackRoutes.PinMatrix,
                            },
                        },
                    ],
                }),
            );
        }
    }, [hasDeviceRequestedPin, isDeviceUnlocked, navigation]);

    // If Device is authorized and loading accounts, redirect to the Home screen.
    useEffect(() => {
        if (isDeviceReadyToUseAndAuthorized && isTimeoutFinished) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: {
                                screen: HomeStackRoutes.Home,
                            },
                        },
                    ],
                }),
            );
        }
    }, [
        isDeviceReadyToUseAndAuthorized,
        isNoPhysicalDeviceConnected,
        isTimeoutFinished,
        navigation,
    ]);
};
