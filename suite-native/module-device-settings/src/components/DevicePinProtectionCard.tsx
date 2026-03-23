import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceProtectedByPin, selectSelectedDevice } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type InlineAlertBoxProps } from '@suite-native/atoms';
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

export const DevicePinProtectionCard = () => {
    const navigation = useNavigation<NavigationProp>();
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
        navigation.navigate(DeviceSettingsStackRoutes.DevicePinProtection);
    };

    return (
        <DeviceSettingsItemCard
            icon="password"
            title={<Translation id="moduleDeviceSettings.pinProtection.title" />}
            subtitle={
                isDeviceProtectedByPin ? (
                    <Translation id="moduleDeviceSettings.pinProtection.cardSubtitle.changeOrRemove" />
                ) : (
                    <Translation id="moduleDeviceSettings.pinProtection.cardSubtitle.enable" />
                )
            }
            alertBoxProps={pinAlertBoxProps}
            onPress={handleOnPress}
            testID="@device-pin-protection/redirectToPinScreen"
        />
    );
};
