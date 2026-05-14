import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { selectShouldDisplaySuiteSyncFirmwareUpdateAlert } from '../homescreenSelectors';

export const SuiteSyncFirmwareUpdateAlert = () => {
    const shouldDisplaySuiteSyncFirmwareUpdateAlert = useSelector(
        selectShouldDisplaySuiteSyncFirmwareUpdateAlert,
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    if (!shouldDisplaySuiteSyncFirmwareUpdateAlert || !isDeviceConnected) {
        return null;
    }

    const handleUpdateFirmware = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceFirmware,
            params: { closeActionType: 'close' },
        });
    };

    return (
        <AnimatedFullAlertBox
            variant="info"
            title={<Translation id="moduleHome.suiteSyncFirmwareUpdateAlert.title" />}
            description={<Translation id="moduleHome.suiteSyncFirmwareUpdateAlert.description" />}
            primaryButtonLabel={<Translation id="moduleHome.suiteSyncFirmwareUpdateAlert.button" />}
            onPressPrimaryButton={handleUpdateFirmware}
            marginHorizontal="sp16"
        />
    );
};
