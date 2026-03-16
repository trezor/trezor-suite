import { useNavigation } from '@react-navigation/native';

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

    const handleRedirect = () => {
        navigation.navigate(DeviceSettingsStackRoutes.WipeDevice);
    };

    return (
        <DeviceSettingsItemCard
            title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
            icon="warningOctagon"
            subtitle={<Translation id="moduleDeviceSettings.wipeDevice.subtitle" />}
            onPress={handleRedirect}
            variant="danger"
            testID="@wipeDevice/redirectToWipeDeviceScreen"
        />
    );
};
