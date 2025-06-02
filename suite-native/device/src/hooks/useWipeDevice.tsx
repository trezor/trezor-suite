import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { setIsWipingDevice } from '@suite-native/device-authorization';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    DeviceSettingsStackRoutes,
    RootStackRoutes,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const device = useSelector(selectSelectedDevice);

    const wipeDevice = async () => {
        if (!device) return;
        dispatch(setIsWipingDevice(true));
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.WipeDeviceStack,
            params: {
                screen: WipeDeviceStackRoutes.ContinueOnTrezor,
            },
        });

        const response = await requestPrioritizedDeviceAccess({
            deviceCallback: async () => await dispatch(wipeDeviceThunk()),
        });

        if (response.success && isFulfilled(response.payload)) {
            navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
                screen: DeviceSettingsStackRoutes.WipeDeviceStack,
                params: {
                    screen: WipeDeviceStackRoutes.WipeDeviceLoadingScreen,
                },
            });
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    };

    return { wipeDevice };
};
