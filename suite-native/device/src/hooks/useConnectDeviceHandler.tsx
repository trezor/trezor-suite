import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { bluetoothActions } from '@suite-common/bluetooth';
import {
    acquireDevice,
    selectIsAnyPhysicalDeviceConnectedViaUsb,
    selectIsDeviceThpLocked,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const useConnectDeviceHandler = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);
    const isAnyPhysicalDeviceConnectedViaUsb = useSelector(
        selectIsAnyPhysicalDeviceConnectedViaUsb,
    );

    const onConnectDevicePress = useCallback(() => {
        if (isDeviceThpLocked) {
            dispatch(acquireDevice({}));
        } else if (isAnyPhysicalDeviceConnectedViaUsb || Platform.OS === 'ios') {
            // Make sure auto-connect is enabled in case some device was manually disconnected.
            dispatch(bluetoothActions.enableAutoConnect());
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice,
            });
        } else {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.ConnectDeviceCrossroads,
            });
        }
    }, [dispatch, isDeviceThpLocked, isAnyPhysicalDeviceConnectedViaUsb, navigation]);

    return { onConnectDevicePress };
};
