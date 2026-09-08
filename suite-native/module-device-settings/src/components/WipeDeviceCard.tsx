import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInBootloader } from '@suite-common/device';
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

export const WipeDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);

    const handleRedirect = () => {
        navigation.navigate(DeviceSettingsStackRoutes.WipeDevice);
    };

    // In bootloader mode wiping the device is presented as a factory reset, mirroring desktop.
    const title = isDeviceInBootloader
        ? 'moduleDeviceSettings.wipeDevice.factoryResetScreen.title'
        : 'moduleDeviceSettings.wipeDevice.title';
    const subtitle = isDeviceInBootloader
        ? 'moduleDeviceSettings.wipeDevice.factoryResetScreen.description'
        : 'moduleDeviceSettings.wipeDevice.subtitle';

    return (
        <DeviceSettingsItemCard
            title={<Translation id={title} />}
            icon="warningOctagon"
            subtitle={<Translation id={subtitle} />}
            onPress={handleRedirect}
            variant="danger"
            testID="@wipeDevice/redirectToWipeDeviceScreen"
        />
    );
};
