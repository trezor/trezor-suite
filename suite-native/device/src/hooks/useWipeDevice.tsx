import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.BackupFailedModal>;

export const useWipeDevice = () => {
    const [isWipeInProgress, setIsWipeInProgress] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);

    const wipeDevice = useCallback(async () => {
        setIsWipeInProgress(true);
        if (!device) return;

        const response = await requestPrioritizedDeviceAccess({
            deviceCallback: async () =>
                await TrezorConnect.wipeDevice({
                    device: {
                        path: device.path,
                    },
                    // In bootloader mode we need the skip the final reload otherwise we never get the resolution
                    skipFinalReload: device.mode === 'bootloader',
                }),
        });

        if (response.success && response.payload.success) {
            navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
            });
        }
        setIsWipeInProgress(false);
    }, [device, navigation]);

    return { wipeDevice, isWipeInProgress };
};
