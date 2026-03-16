import { type ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, type ButtonColorProps } from '@suite-native/atoms';
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
    buttonColorProps?: ButtonColorProps;
};

export const DevicePinActionButton = ({
    children,
    type,
    buttonColorProps = {
        intent: 'brand',
        priority: 'primary',
    },
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
            {...buttonColorProps}
            size="medium"
            testID={`@device-pin-protection/${type}-button`}
            isDisabled={isDiscoveryRunning}
            isLoading={isDiscoveryRunning}
        >
            {children}
        </Button>
    );
};
