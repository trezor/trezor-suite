import { useSelector } from 'react-redux';

import { selectDeviceModel, selectDeviceName } from '@suite-common/device';
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

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);

    if (!deviceModel) return null;

    return (
        <HStack
            style={applyStyle(contentWrapperStyle, { height: DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT })}
        >
            <DeviceItemIcon deviceModel={deviceModel} />
            <Box style={applyStyle(itemStyle, { isCompact: true })}>
                <Text
                    variant="body-md-strong"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(headerStyle)}
                >
                    {deviceName}
                </Text>
                <Box>
                    <DeviceConnectionStatus isConnected={false} isDeviceInBootloaderMode={true} />
                </Box>
            </Box>
        </HStack>
    );
};
