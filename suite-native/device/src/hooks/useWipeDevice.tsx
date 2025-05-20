import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { setIsWipingDevice } from '@suite-native/device-authorization';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes.ContinueOnTrezor,
    RootStackParamList
>;

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);

    const wipeDevice = useCallback(async () => {
        if (!device) return;
        dispatch(setIsWipingDevice(true));
        navigation.navigate(WipeDeviceStackRoutes.ContinueOnTrezor);

        const response = await requestPrioritizedDeviceAccess({
            deviceCallback: async () => await dispatch(wipeDeviceThunk()),
        });

        if (response.success && isFulfilled(response.payload)) {
            navigation.navigate(WipeDeviceStackRoutes.WipeDeviceLoadingScreen);
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [device, navigation, dispatch]);

    return { wipeDevice };
};
