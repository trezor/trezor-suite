import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { SettingsItemCard } from './SettingsItemCard';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticity);
    };

    return (
        <SettingsItemCard
            icon="shieldCheck"
            onPress={handleOnPress}
            title={<Translation id="moduleDeviceSettings.authenticity.title" />}
            subtitle={<Translation id="moduleDeviceSettings.authenticity.content" />}
            testID="@device-authenticity/redirectToDeviceAuthenticityScreen"
        />
    );
};
