import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { EventType } from '@suite-common/analytics-types';
import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';

type NavigationProps = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.WipeDeviceStack
>;

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();
    const navigation = useNavigation<NavigationProps>();

    const device = useSelector(selectSelectedDevice);

    const wipeDevice = async () => {
        if (!device) return;

        // After wipe, device gets changed and reconnected. That would trigger redirect to device onboarding which is
        // not wanted here. We want to treat it differently since it was wiped so user goes to onboarding through homescreen.
        dispatch(setWasDeviceOnboardingCancelled(true));

        navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack);

        const response = await requestPrioritizedDeviceAccess({
            deviceCallback: async () => await dispatch(wipeDeviceThunk()),
        });

        if (response.success && isFulfilled(response.payload)) {
            legacyAnalytics.report({
                type: EventType.SettingsDeviceWipe,
            });
            navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack, {
                screen: WipeDeviceStackRoutes.WipeDeviceLoadingScreen,
            });
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    };

    return { wipeDevice };
};
