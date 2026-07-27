import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const BackupAndPassphraseCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);

    if (!device) {
        return;
    }

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceBackupAndPassphrase);
    };

    return (
        <DeviceSettingsItemCard
            icon="wallet"
            title={<Translation id="moduleDeviceSettings.backupAndPassphrase.title" />}
            subtitle={<Translation id="moduleDeviceSettings.backupAndPassphrase.description" />}
            onPress={handleOnPress}
            testID="@device-backupAndPassphrase/redirectToBackupAndPassphraseScreen"
        />
    );
};
