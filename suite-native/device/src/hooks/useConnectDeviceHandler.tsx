import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { acquireDevice, selectIsDeviceThpRequired } from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
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

    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);

    const isDeviceThpRequired = useSelector(selectIsDeviceThpRequired);

    const isIosWithBluetoothEnabled = Platform.OS === 'ios' && isBluetoothEnabled;

    const onConnectDevicePress = useCallback(() => {
        if (isDeviceThpRequired) {
            dispatch(acquireDevice({}));
        } else {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: isIosWithBluetoothEnabled
                    ? AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice
                    : AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
            });
        }
    }, [dispatch, isDeviceThpRequired, isIosWithBluetoothEnabled, navigation]);

    return { onConnectDevicePress };
};
