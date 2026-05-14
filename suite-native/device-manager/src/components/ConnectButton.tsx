import { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { AnimatedBox, Box, Button } from '@suite-native/atoms';
import { useConnectDeviceHandler } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useDeviceManager } from '../hooks/useDeviceManager';

type ConnectButtonProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
}));

const buttonSurfaceStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.r12,
}));

export const ConnectButton = ({ onSelectDevice }: ConnectButtonProps) => {
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const { applyStyle } = useNativeStyles();
    const analytics = useAnalytics();
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const device = useSelector(selectSelectedDevice);

    const { onConnectDevicePress } = useConnectDeviceHandler();

    if (hasDiscovery) {
        return null;
    }

    const handleConnectDevice = () => {
        if (device) {
            onSelectDevice(device);
        }
        setIsDeviceManagerVisible(false);

        onConnectDevicePress();

        analytics.report({
            type: events.switcherEvent.name,
            payload: { action: 'connectDeviceButton' },
        });
    };

    return (
        <AnimatedBox
            style={applyStyle(buttonWrapperStyle)}
            layout={LinearTransition}
            entering={FadeInUp}
            exiting={FadeOutUp}
        >
            <Box style={applyStyle(buttonSurfaceStyle)}>
                <Button
                    iconLeft="trezorDevices"
                    intent="neutral"
                    priority="secondary"
                    isFullWidth
                    onPress={handleConnectDevice}
                >
                    <Translation id="deviceManager.connectButton" />
                </Button>
            </Box>
        </AnimatedBox>
    );
};
