import { useNavigation } from '@react-navigation/native';

import { Button, CardWithIconLayout, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceBackupAndPassphrase
>;

export const CreateAdditionalBackupCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToCreateAdditionalBackup = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceCreateAdditionalBackupStack);
    };

    return (
        <CardWithIconLayout
            icon="trezorBackup"
            title={<Translation id="moduleDeviceSettings.createAdditionalBackup.title" />}
        >
            <VStack spacing="sp16">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleDeviceSettings.createAdditionalBackup.subtitle" />
                </Text>
                <Button
                    size="medium"
                    flex={1}
                    onPress={navigateToCreateAdditionalBackup}
                    intent="neutral"
                    priority="secondary"
                    testID="@create-additional-backup/redirect"
                >
                    <Translation id="moduleDeviceSettings.createAdditionalBackup.button" />
                </Button>
            </VStack>
        </CardWithIconLayout>
    );
};
