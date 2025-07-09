import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_SUPPORT_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';

const SUPPORT_URL = `${TREZOR_SUPPORT_RECOVERY_ISSUES_URL}#open-chat`;

export const DeviceCheckBackupSupportScreen = () => {
    const openLink = useOpenLink();
    const handleSupportButtonPress = () => {
        openLink(SUPPORT_URL);
    };

    return (
        <CheckBackupScreenWithExitButton>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        icon="chatsTeardrop"
                        titleVariant="titleMedium"
                        variant="success"
                        title={
                            <Translation id="moduleCheckBackup.checkBackupSupportScreen.title" />
                        }
                        subtitle={
                            <Translation id="moduleCheckBackup.checkBackupSupportScreen.description" />
                        }
                    />
                </Box>

                <Button onPress={handleSupportButtonPress} isFullWidth viewLeft="arrowSquareOut">
                    <Translation id="moduleCheckBackup.checkBackupSupportScreen.button" />
                </Button>
            </VStack>
        </CheckBackupScreenWithExitButton>
    );
};
