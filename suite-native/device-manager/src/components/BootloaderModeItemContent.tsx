import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { Box, HStack, Text } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles-native';

import { DeviceConnectionStatus } from './DeviceItem/DeviceConnectionStatus';
import {
    DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT,
    contentWrapperStyle,
    itemStyle,
} from './DeviceItem/DeviceItemContent';
import { DeviceItemIcon } from './DeviceItem/DeviceItemIcon';
import { headerStyle } from './DeviceItem/SimpleDeviceItemContent';

export const BootloaderModeItemContent = () => {
    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectSelectedDevice);

    if (!device) return null;

    return (
        <HStack
            style={applyStyle(contentWrapperStyle, { height: DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT })}
        >
            <DeviceItemIcon deviceId={null} />
            <Box style={applyStyle(itemStyle, { isCompact: true })}>
                <Text
                    variant="body-md-strong"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(headerStyle)}
                >
                    {device.name}
                </Text>
                <Box>
                    <DeviceConnectionStatus isConnected={false} isDeviceInBootloaderMode={true} />
                </Box>
            </Box>
        </HStack>
    );
};
