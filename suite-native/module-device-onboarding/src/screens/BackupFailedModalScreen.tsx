import { useEffect } from 'react';

import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { BACKUP_FAILED_SUPPORT_URL, useWipeDeviceAlert } from '../hooks/useWipeDeviceAlert';

export const BackupFailedModalScreen = ({
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.BackupFailedModal>) => {
    const openLink = useOpenLink();
    const { showWipeDeviceAlert, isWipeInProgress } = useWipeDeviceAlert();

    const handleSecondaryButtonPress = () => openLink(BACKUP_FAILED_SUPPORT_URL);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (isWipeInProgress && e.data.action.type === 'GO_BACK') {
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [navigation, isWipeInProgress]);

    if (isWipeInProgress) {
        return (
            <Screen header={<ScreenHeader leftIcon={null} />}>
                <ContinueOnTrezorScreenContent />
            </Screen>
        );
    }

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
