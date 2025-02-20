import { useNavigation } from '@react-navigation/native';

import { ConfirmFirmwareUpdateScreenContent } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
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

    return <ConfirmFirmwareUpdateScreenContent onUpdateConfirmation={handleUpdateConfirmation} />;
};
