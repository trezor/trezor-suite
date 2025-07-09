import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    DeviceCheckBackupStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const DeviceCheckBackupCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceCheckBackupStack, {
            screen: DeviceCheckBackupStackRoutes.CheckBackupTutorial,
        });
    };

    return (
        <DeviceSettingsItemCard
            icon="trezorBackup"
            onPress={handleOnPress}
            title={<Translation id="moduleDeviceSettings.checkBackup.title" />}
            subtitle={<Translation id="moduleDeviceSettings.checkBackup.subtitle" />}
            testID="@device-check-backup/redirectToDeviceCheckBackupScreen"
        />
    );
};
