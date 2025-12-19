import { useNavigation } from '@react-navigation/native';

import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const useNavigateToCheckBackup = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToCheckBackup = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceCheckBackupStack);
    };

    return { navigateToCheckBackup };
};
