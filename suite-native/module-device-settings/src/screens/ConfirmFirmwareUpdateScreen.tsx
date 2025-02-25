import { useNavigation } from '@react-navigation/native';

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

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.ConfirmFirmwareUpdate
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleUpdateConfirmation = () => {
        navigation.navigate(DeviceStackRoutes.FirmwareInstallation);
    };

    return (
        <Screen
            footer={
                <ConfirmFirmwareUpdateScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                />
            }
        >
            <ConfirmFirmwareUpdateScreenContent />
        </Screen>
    );
};
