import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { wipeDeviceThunk } from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

type NavigationProps = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.WipeDeviceStack
>;

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProps>();

    const device = useSelector(selectSelectedDevice);

    const navigateToWipeDeviceStack = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack);
    }, [navigation]);

    const wipeDevice = async () => {
        if (!device) return;

        // After wipe, device gets changed and reconnected. That would trigger redirect to device onboarding which is
        // not wanted here. We want to treat it differently since it was wiped so user goes to onboarding through homescreen.
        dispatch(setWasDeviceOnboardingCancelled(true));

        navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack);

        const response = await requestPrioritizedDeviceAccess(
            async () => await dispatch(wipeDeviceThunk()),
        );

        if (response.success && isFulfilled(response.payload)) {
            analytics.report({
                type: events.settingsDeviceWipeEvent.name,
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

    return { navigateToWipeDeviceStack, wipeDevice };
};
