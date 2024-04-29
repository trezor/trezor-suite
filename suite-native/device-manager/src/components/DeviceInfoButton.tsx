import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { selectDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceAction } from './DeviceAction';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

type DeviceInfoButtonProps = {
    showAsFullWidth: boolean;
};

const contentStyle = prepareNativeStyle<{ showAsFullWidth: boolean }>((_, { showAsFullWidth }) => ({
    extend: {
        condition: showAsFullWidth,
        style: {
            flex: 1,
            justifyContent: 'center',
        },
    },
}));

export const DeviceInfoButton = ({ showAsFullWidth }: DeviceInfoButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const selectedDevice = useSelector(selectDevice);

    const handleDeviceRedirect = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.DeviceInfo);
        analytics.report({ type: EventType.DeviceManagerClick, payload: { action: 'deviceInfo' } });
    };

    if (!selectedDevice) return null;

    return (
        <DeviceAction
            testID="@device-manager/device/info"
            onPress={handleDeviceRedirect}
            showAsFullWidth={showAsFullWidth}
        >
            <HStack spacing="small" style={applyStyle(contentStyle, { showAsFullWidth })}>
                <Icon name="infoLight" size="mediumLarge" />
                <Text variant="hint">
                    <Translation id="deviceManager.deviceButtons.deviceInfo" />
                </Text>
            </HStack>
        </DeviceAction>
    );
};
