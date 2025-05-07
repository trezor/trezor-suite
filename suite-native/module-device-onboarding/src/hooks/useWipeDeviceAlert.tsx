import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

export const BACKUP_FAILED_SUPPORT_URL =
    'https://trezor.io/support/a/trezor-recovery-issues#open-chat';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.BackupFailedModal>;

export const useWipeDeviceAlert = () => {
    const [isWipeInProgress, setIsWipeInProgress] = useState(false);
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const openLink = useOpenLink();
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

    const showWipeDeviceAlert = useCallback(
        () =>
            showAlert({
                title: (
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.alert.title" />
                ),
                description: (
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.alert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.alert.primaryButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: wipeDevice,
                secondaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.alert.secondaryButton" />
                ),
                secondaryButtonVariant: 'redElevation1',
                onPressSecondaryButton: () => openLink(BACKUP_FAILED_SUPPORT_URL),
            }),
        [showAlert, openLink, wipeDevice],
    );

    return {
        showWipeDeviceAlert,
        isWipeInProgress,
    };
};
