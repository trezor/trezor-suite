import { type ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, type ButtonColorScheme } from '@suite-native/atoms';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type PinActionType,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DevicePinProtectionStack
>;

type DevicePinActionButtonProps = {
    children: ReactNode;
    type: PinActionType;
    colorScheme?: ButtonColorScheme;
};

export const DevicePinActionButton = ({
    children,
    type,
    colorScheme,
}: DevicePinActionButtonProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const navigation = useNavigation<NavigationProp>();

    const navigateToPinStack = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.DevicePinProtectionStack, {
            type,
        });
    }, [navigation, type]);

    return (
        <Button
            onPress={navigateToPinStack}
            colorScheme={colorScheme}
            size="medium"
            testID={`@device-pin-protection/${type}-button`}
            isDisabled={isDiscoveryRunning}
            isLoading={isDiscoveryRunning}
        >
            {children}
        </Button>
    );
};
