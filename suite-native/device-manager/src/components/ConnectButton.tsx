import { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    selectHasRunningDiscovery,
    selectIsNoPhysicalDeviceConnected,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { useConnectDeviceHandler } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDeviceManager } from '../hooks/useDeviceManager';

type ConnectButtonProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
}));

export const ConnectButton = ({ onSelectDevice }: ConnectButtonProps) => {
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const { applyStyle } = useNativeStyles();

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const device = useSelector(selectSelectedDevice);

    const isConnectButtonVisible = !hasDiscovery && isNoPhysicalDeviceConnected;

    const { onConnectDevicePress } = useConnectDeviceHandler();

    const handleConnectDevice = () => {
        if (device) {
            onSelectDevice(device);
        }
        setIsDeviceManagerVisible(false);

        onConnectDevicePress();

        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'connectDeviceButton' },
        });
    };

    if (!isConnectButtonVisible) return null;

    return (
        <AnimatedBox
            style={applyStyle(buttonWrapperStyle)}
            layout={LinearTransition}
            entering={FadeInUp}
            exiting={FadeOutUp}
        >
            <Button
                viewLeft="trezorDevices"
                colorScheme="tertiaryElevation0"
                onPress={handleConnectDevice}
            >
                <Translation id="deviceManager.connectButton" />
            </Button>
        </AnimatedBox>
    );
};
