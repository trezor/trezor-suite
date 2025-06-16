import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles';

import { DeviceConnectionStatus } from './DeviceItem/DeviceConnectionStatus';
import {
    DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT,
    contentWrapperStyle,
    itemStyle,
} from './DeviceItem/DeviceItemContent';
import { DeviceItemIcon } from './DeviceItem/DeviceItemIcon';
import { SimpleDeviceItemContent, headerStyle } from './DeviceItem/SimpleDeviceItemContent';

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
                <SimpleDeviceItemContent
                    deviceState={undefined}
                    headerTextVariant="highlight"
                    header={<Translation id="deviceManager.status.bootloader" />}
                    isPortfolioTrackerDevice={false}
                    isSubHeaderForceHidden={true}
                />
                <>
                    <Text
                        variant="highlight"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        style={applyStyle(headerStyle)}
                    >
                        {device.name}
                    </Text>
                    <Box>
                        <DeviceConnectionStatus isConnected={false} />
                    </Box>
                </>
            </Box>
        </HStack>
    );
};
