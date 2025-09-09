import { useDispatch, useSelector } from 'react-redux';

import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isFulfilled } from '@reduxjs/toolkit';

import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProps = CompositeNavigationProp<
    NativeStackNavigationProp<WipeDeviceStackParamList, WipeDeviceStackRoutes.WipeDevice>,
    CompositeNavigationProp<
        NativeStackNavigationProp<DeviceSettingsStackParamList>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const device = useSelector(selectSelectedDevice);

    const wipeDevice = async () => {
        if (!device) return;

        // After wipe, device gets changed and reconnected. That would trigger redirect to device onboarding which is
        // not wanted here. We want to treat it differently since it was wiped so user goes to onboarding through homescreen.
        dispatch(setWasDeviceOnboardingCancelled(true));

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
