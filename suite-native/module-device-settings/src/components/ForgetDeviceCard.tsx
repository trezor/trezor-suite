import { useNavigation } from '@react-navigation/native';

import { PressableCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const ForgetDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToForgetDevice = () => {
        navigation.navigate(DeviceSettingsStackRoutes.ForgetDevice);
    };

    return (
        <PressableCardWithIconLayout
            icon="linkBreak"
            title={<Translation id="moduleDeviceSettings.forgetDevice.title" />}
            description={<Translation id="moduleDeviceSettings.forgetDevice.description" />}
            onPress={navigateToForgetDevice}
        />
    );
};
