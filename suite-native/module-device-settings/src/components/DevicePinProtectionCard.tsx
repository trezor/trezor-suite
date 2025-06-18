import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectHasRunningDiscovery,
    selectIsDeviceProtectedByPin,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { InlineAlertBoxProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DeviceSettingsStackRoutes } from '@suite-native/navigation';

import { SettingsItemCard } from './SettingsItemCard';

export const DevicePinProtectionCard = () => {
    const navigation = useNavigation<any>();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const device = useSelector(selectSelectedDevice);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);

    if (!device) {
        return;
    }

    const navigateToPinStack = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DevicePinProtectionStack, {
            type: 'enable',
        });
    };

    const pinAlertBoxProps = ((): InlineAlertBoxProps | undefined => {
        if (!isDeviceProtectedByPin) {
            return {
                title: <Translation id="moduleDeviceSettings.pinProtection.alertBoxTitle" />,
                variant: 'warning',
                buttonLabel: <Translation id="moduleDeviceSettings.pinProtection.buttons.setPin" />,
                onButtonPress: navigateToPinStack,
                buttonProps: {
                    isDisabled: isDiscoveryRunning,
                    isLoading: isDiscoveryRunning,
                },
            } as const;
        }

        return undefined;
    })();

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.PinProtection);
    };

    return (
        <SettingsItemCard
            icon="password"
            title={<Translation id="moduleDeviceSettings.pinProtection.title" />}
            subtitle={<Translation id="moduleDeviceSettings.pinProtection.cardSubtitle" />}
            alertBoxProps={pinAlertBoxProps}
            onPress={handleOnPress}
        />
    );
};
