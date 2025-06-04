import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { useSetAtom } from 'jotai';

import { selectSelectedDevice, wipeDeviceThunk } from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    DeviceSettingsStackRoutes,
    RootStackRoutes,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

import { wasDeviceOnboardingCancelledAtom } from '../deviceAtoms';

export const useWipeDevice = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const device = useSelector(selectSelectedDevice);
    const setWasDeviceOnboardingCancelled = useSetAtom(wasDeviceOnboardingCancelledAtom);

    const wipeDevice = async () => {
        if (!device) return;

        // After wipe, device gets changed and reconnected. That would trigger redirect to device onboarding which is
        // not wanted here. We want to treat it differently since it was wiped so user goes to onboarding through homescreen.
        setWasDeviceOnboardingCancelled(true);

        // @ts-expect-error
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
            // @ts-expect-error
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
