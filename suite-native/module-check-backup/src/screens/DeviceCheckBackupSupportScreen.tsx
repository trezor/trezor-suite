import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useAnalytics } from '@suite-native/services';
import { TREZOR_SUPPORT_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';

const SUPPORT_URL = `${TREZOR_SUPPORT_RECOVERY_ISSUES_URL}#open-chat`;

export const DeviceCheckBackupSupportScreen = () => {
    const openLink = useOpenLink();
    const analytics = useAnalytics();
    const handleSupportButtonPress = () => {
        openLink(SUPPORT_URL);
    };

    useFocusEffect(
        useCallback(() => {
            analytics.report({
                type: events.deviceSettingsCheckBackupSupportEvent.name,
            });
        }, [analytics]),
    );

    return (
        <CheckBackupScreenWithExitButton>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        icon="chatsTeardrop"
                        titleVariant="headline-md"
                        variant="success"
                        title={
                            <Translation id="moduleCheckBackup.checkBackupSupportScreen.title" />
                        }
                        subtitle={
                            <Translation id="moduleCheckBackup.checkBackupSupportScreen.description" />
                        }
                    />
                </Box>

                <Button onPress={handleSupportButtonPress} isFullWidth iconLeft="arrowSquareOut">
                    <Translation id="moduleCheckBackup.checkBackupSupportScreen.button" />
                </Button>
            </VStack>
        </CheckBackupScreenWithExitButton>
    );
};
