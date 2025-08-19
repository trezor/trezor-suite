import { useMemo } from 'react';
import { Platform } from 'react-native';
import { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    selectHasRunningDiscovery,
    selectInstacelessUnselectedDevices,
    selectIsNoPhysicalDeviceConnected,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDeviceManager } from '../hooks/useDeviceManager';

type ConnectButtonProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const ConnectButton = ({ onSelectDevice }: ConnectButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);
    const device = useSelector(selectSelectedDevice);
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);

    const hasUnselectedDevices = notSelectedInstancelessDevices.length > 0;

    const isOnlyBluetoothSupported = Platform.OS === 'ios' && isBluetoothEnabled;

    const isConnectButtonVisible = !hasDiscovery && isNoPhysicalDeviceConnected;

    const handleConnectDevice = () => {
        const connectDeviceScreen = isOnlyBluetoothSupported
            ? AuthorizeDeviceStackRoutes.ConnectBluetoothDevice
            : AuthorizeDeviceStackRoutes.ConnectAndUnlockDeviceAuthorize;

        if (device) {
            onSelectDevice(device);
        }
        setIsDeviceManagerVisible(false);

        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: connectDeviceScreen,
        });

        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'connectDeviceButton' },
        });
    };

    const buttonViewLeft: IconName | undefined = useMemo(() => {
        if (isOnlyBluetoothSupported) {
            return 'bluetooth';
        }

        return undefined;
    }, [isOnlyBluetoothSupported]);

    const buttonText: TxKeyPath = useMemo(() => {
        if (isOnlyBluetoothSupported) {
            return 'deviceManager.connectButton.bluetooth';
        }
        if (hasUnselectedDevices) {
            return 'deviceManager.connectButton.another';
        }

        return 'deviceManager.connectButton.first';
    }, [isOnlyBluetoothSupported, hasUnselectedDevices]);

    if (!isConnectButtonVisible) return null;

    return (
        <AnimatedBox
            style={applyStyle(buttonWrapperStyle)}
            layout={LinearTransition}
            entering={FadeInUp}
            exiting={FadeOutUp}
        >
            <Button
                viewLeft={buttonViewLeft}
                colorScheme="tertiaryElevation0"
                onPress={handleConnectDevice}
            >
                <Translation id={buttonText} />
            </Button>
        </AnimatedBox>
    );
};
