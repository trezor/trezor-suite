import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';

import {
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '@suite-native/navigation';
import {
    selectIsSelectedDeviceImported,
    selectIsNoPhysicalDeviceConnected,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/wallet-core';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';

export const useHandleDeviceConnection = () => {
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isSelectedDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);

    const navigation = useNavigation();

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (isOnboardingFinished && !isSelectedDeviceImported && !isDeviceConnectedAndAuthorized) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.ConnectDevice,
                            params: {
                                screen: ConnectDeviceStackRoutes.ConnectingDevice,
                            },
                        },
                    ],
                }),
            );
        }
    }, [
        isOnboardingFinished,
        isSelectedDeviceImported,
        isNoPhysicalDeviceConnected,
        isDeviceConnectedAndAuthorized,
        navigation,
    ]);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isNoPhysicalDeviceConnected && isOnboardingFinished) {
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
    }, [isNoPhysicalDeviceConnected, isOnboardingFinished, navigation]);
};
