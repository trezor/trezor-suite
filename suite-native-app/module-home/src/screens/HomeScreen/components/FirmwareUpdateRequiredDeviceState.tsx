import { useNavigation } from '@react-navigation/native';

import { Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

export const FirmwareUpdateRequiredDeviceState = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const navigateToFirmwareUpdate = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceFirmware,
            params: { closeActionType: 'close' },
        });
    };

    return (
        <Card>
            <VStack marginTop="sp16" spacing="sp24">
                <PictogramTitleHeader
                    variant="warning"
                    title={<Translation id="moduleHome.emptyState.firmwareUpdateRequired.title" />}
                    subtitle={
                        <Translation id="moduleHome.emptyState.firmwareUpdateRequired.subtitle" />
                    }
                />
                <Button
                    onPress={navigateToFirmwareUpdate}
                    testID="@homescreen/firmwareUpdateRequired/update-button"
                >
                    <Translation id="moduleHome.emptyState.firmwareUpdateRequired.button" />
                </Button>
            </VStack>
        </Card>
    );
};
