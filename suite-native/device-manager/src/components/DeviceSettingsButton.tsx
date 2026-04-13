import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const DeviceSettingsButton = () => {
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const selectedDevice = useSelector(selectSelectedDevice);

    const handleDeviceRedirect = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceSettings,
        });
        analytics.report({
            type: events.switcherEvent.name,
            payload: { action: 'deviceSettings' },
        });
    };

    if (!selectedDevice) return null;

    return (
        <Button
            intent="neutral"
            priority="secondary"
            iconLeft="gear"
            onPress={handleDeviceRedirect}
            testID="@device-manager/device-settings-button"
        >
            <Translation id="deviceManager.deviceButtons.deviceSettings" />
        </Button>
    );
};
