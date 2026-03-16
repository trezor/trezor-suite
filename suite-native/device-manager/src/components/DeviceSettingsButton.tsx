import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { events } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceAction } from './DeviceAction';
import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

type DeviceInfoButtonProps = {
    showAsFullWidth: boolean;
};

const contentStyle = prepareNativeStyle<{ showAsFullWidth: boolean }>(
    (utils, { showAsFullWidth }) => ({
        marginRight: utils.spacings.sp4,
        extend: {
            condition: showAsFullWidth,
            style: {
                flex: 1,
                justifyContent: 'center',
            },
        },
    }),
);

export const DeviceSettingsButton = ({ showAsFullWidth }: DeviceInfoButtonProps) => {
    const analytics = useAnalytics();
    const { applyStyle } = useNativeStyles();
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
        <DeviceAction
            testID="@device-manager/device-settings-button"
            onPress={handleDeviceRedirect}
            showAsFullWidth={showAsFullWidth}
        >
            <HStack spacing="sp8" style={applyStyle(contentStyle, { showAsFullWidth })}>
                <Icon name="gear" size="mediumLarge" />
                <Text variant="body-sm">
                    <Translation id="deviceManager.deviceButtons.deviceSettings" />
                </Text>
            </HStack>
        </DeviceAction>
    );
};
