import { useNavigation } from '@react-navigation/native';

import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.FirmwareInstallation
>;

export const FirmwareInstallationScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleFirmwareInstallationSuccess = () => {
        const initialRoute = navigation.getState().routes.at(0)
            ?.name as DeviceStackRoutes.DeviceSettings;

        if (initialRoute) {
            navigation.navigate(initialRoute);
        } else {
            // This cause should not happen, but just to be safe
            navigation.popToTop();
        }
    };

    const handleFirmwareInstallationFailure = () => {
        navigation.navigate(DeviceStackRoutes.ConfirmFirmwareUpdate);
    };

    return (
        <Screen>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
                navigationLocation="settings"
            />
        </Screen>
    );
};
