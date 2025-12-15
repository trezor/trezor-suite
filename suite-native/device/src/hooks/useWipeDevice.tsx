import { useDispatch, useSelector } from 'react-redux';

import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isFulfilled } from '@reduxjs/toolkit';

import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { EventTypeShared, analytics } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import type {
    DeviceSettingsStackParamList,
    RootStackParamList,
    WipeDeviceStackParamList,
} from '@suite-native/navigation';
import {
    DeviceSettingsStackRoutes,
    RootStackRoutes,
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
            analytics.report({
                type: EventTypeShared.SettingsDeviceWipe,
            });
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
