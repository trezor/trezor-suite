import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

export const BACKUP_FAILED_SUPPORT_URL = `${HELP_CENTER_RECOVERY_ISSUES_URL}#open-chat`;

export const BackupFailedModalScreen = () => {
    const openLink = useOpenLink();
    const { showAlert } = useAlert();
    const { navigateToWipeDeviceStack } = useWipeDevice();

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
                onPressPrimaryButton: navigateToWipeDeviceStack,
                secondaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.alert.secondaryButton" />
                ),
                secondaryButtonVariant: 'redElevation1',
                onPressSecondaryButton: () => openLink(BACKUP_FAILED_SUPPORT_URL),
            }),
        [showAlert, openLink, navigateToWipeDeviceStack],
    );

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="sp32" flex={1} paddingTop="sp16">
                <TitleHeader
                    titleVariant="headline-md"
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
                        textVariant="body-md-strong"
                        iconSize="large"
                    >
                        <Translation id="moduleDeviceOnboarding.backupFailedModalScreen.steps.wipe" />
                    </IconListTextItem>

                    <IconListTextItem
                        icon="chatCircle"
                        variant="red"
                        textVariant="body-md-strong"
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
