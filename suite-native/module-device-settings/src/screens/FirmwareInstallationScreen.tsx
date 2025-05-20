import { useNavigation } from '@react-navigation/native';

import { Box } from '@suite-native/atoms';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.FirmwareInstallation
>;

export const FirmwareInstallationScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleFirmwareInstallationSuccess = () => {
        const initialRoute = navigation.getState().routes.at(0)
            ?.name as DeviceSettingsStackRoutes.DeviceSettings;

        if (initialRoute) {
            navigation.navigate(initialRoute);
        } else {
            // This cause should not happen, but just to be safe
            navigation.popToTop();
        }
    };

    const handleFirmwareInstallationFailure = () => {
        navigation.navigate(DeviceSettingsStackRoutes.ConfirmFirmwareUpdate);
    };

    return (
        <Screen>
            <Box flex={1}>
                <FirmwareInstallationScreenContent
                    onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                    onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
                    navigationLocation="settings"
                />
            </Box>
        </Screen>
    );
};
