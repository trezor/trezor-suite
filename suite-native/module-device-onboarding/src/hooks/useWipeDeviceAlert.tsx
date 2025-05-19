import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

export const BACKUP_FAILED_SUPPORT_URL =
    'https://trezor.io/support/a/trezor-recovery-issues#open-chat';

export const useWipeDeviceAlert = () => {
    const { showAlert } = useAlert();
    const openLink = useOpenLink();
    const { wipeDevice, isWipeInProgress } = useWipeDevice();

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
        wipeDevice,
        isWipeInProgress,
    };
};
