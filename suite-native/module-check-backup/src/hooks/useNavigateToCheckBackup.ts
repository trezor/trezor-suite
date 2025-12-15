import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceModel } from '@suite-common/wallet-core';
import type { DeviceSettingsStackParamList, StackNavigationProps } from '@suite-native/navigation';
import { DeviceCheckBackupStackRoutes, DeviceSettingsStackRoutes } from '@suite-native/navigation';
import { DeviceModelInternal, models } from '@trezor/device-utils';

const checkBackupUnsupportedDeviceModels: DeviceModelInternal[] = [DeviceModelInternal.T1B1];

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const useNavigateToCheckBackup = () => {
    const deviceModel = useSelector(selectDeviceModel);
    const navigation = useNavigation<NavigationProp>();

    const navigateToCheckBackup = () => {
        if (deviceModel && checkBackupUnsupportedDeviceModels.includes(deviceModel)) {
            navigation.navigate(DeviceSettingsStackRoutes.DeviceCheckBackupStack, {
                screen: DeviceCheckBackupStackRoutes.UnsupportedModel,
                params: { deviceModel: models[deviceModel].name },
            });

            return;
        }
        navigation.navigate(DeviceSettingsStackRoutes.DeviceCheckBackupStack, {
            screen: DeviceCheckBackupStackRoutes.CheckBackupTutorial,
        });
    };

    return { navigateToCheckBackup };
};
