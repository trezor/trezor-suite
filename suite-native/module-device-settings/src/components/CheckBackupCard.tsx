import { Button, CardWithIconLayout, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';

export const CheckBackupCard = () => {
    const { navigateToCheckBackup } = useNavigateToCheckBackup();

    return (
        <CardWithIconLayout
            icon="trezorBackup"
            title={<Translation id="moduleDeviceSettings.checkBackup.title" />}
        >
            <VStack spacing="sp16">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleDeviceSettings.checkBackup.subtitle" />
                </Text>
                <Button
                    size="medium"
                    flex={1}
                    onPress={navigateToCheckBackup}
                    intent="neutral"
                    priority="secondary"
                    testID="@device-check-backup/redirectToDeviceCheckBackupScreen"
                >
                    <Translation id="moduleDeviceSettings.checkBackup.title" />
                </Button>
            </VStack>
        </CardWithIconLayout>
    );
};
