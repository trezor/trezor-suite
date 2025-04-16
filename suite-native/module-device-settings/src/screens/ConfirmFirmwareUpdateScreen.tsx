import { useNavigation } from '@react-navigation/native';

import { Box } from '@suite-native/atoms';
import {
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.ConfirmFirmwareUpdate
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { isDeviceConnected } = useDeviceConnectionGuard();

    const handleUpdateConfirmation = () => {
        navigation.navigate(DeviceStackRoutes.FirmwareInstallation);
    };

    if (!isDeviceConnected) return;

    return (
        <Screen
            footer={
                <ConfirmFirmwareUpdateScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                />
            }
        >
            <Box flex={1} marginTop="sp16">
                <ConfirmFirmwareUpdateScreenContent />
            </Box>
        </Screen>
    );
};
