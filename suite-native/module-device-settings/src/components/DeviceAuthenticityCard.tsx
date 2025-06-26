import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

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
        <CompactCardWithIconLayout
            icon="shield"
            onPress={handleOnPress}
            title={<Translation id="moduleDeviceSettings.authenticity.title" />}
            subtitle={<Translation id="moduleDeviceSettings.authenticity.content" />}
            testID="@device-authenticity/redirectToDeviceAuthenticityScreen"
        />
    );
};
