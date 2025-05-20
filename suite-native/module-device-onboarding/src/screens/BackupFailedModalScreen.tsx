import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const BACKUP_FAILED_SUPPORT_URL =
    'https://trezor.io/support/a/trezor-recovery-issues#open-chat';

export const BackupFailedModalScreen = () => {
    const openLink = useOpenLink();
    const { showAlert } = useAlert();
    const { wipeDevice } = useWipeDevice();

    const handleSecondaryButtonPress = () => openLink(BACKUP_FAILED_SUPPORT_URL);

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

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="sp32" flex={1} paddingTop="sp16">
                <TitleHeader
                    titleVariant="titleMedium"
                    titleSpacing="sp12"
                    title={
                        <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.title" />
                    }
                    subtitle={
                        <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.subtitle" />
                    }
                />
                <VStack spacing="sp24">
                    <IconListTextItem
                        icon="plugs"
                        variant="red"
                        textVariant="highlight"
                        iconSize="large"
                    >
                        <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.steps.wipe" />
                    </IconListTextItem>

                    <IconListTextItem
                        icon="chatCircle"
                        variant="red"
                        textVariant="highlight"
                        iconSize="large"
                    >
                        <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.steps.contact" />
                    </IconListTextItem>
                </VStack>
            </VStack>
            <VStack spacing="sp12">
                <Button colorScheme="redBold" onPress={showWipeDeviceAlert}>
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.primaryButton" />
                </Button>
                <Button colorScheme="redElevation1" onPress={handleSecondaryButtonPress}>
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.secondaryButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
