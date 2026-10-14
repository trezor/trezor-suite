import { useWindowDimensions } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { ConnectorImage } from '@suite-native/device';
import { DevicePinImage } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const DEVICE_IMAGE_MAX_HEIGHT_RATIO = 0.42;
const CONNECTOR_IMAGE_MAX_HEIGHT_RATIO = 0.18;

const wrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: utils.spacings.sp24,
}));

type PinOnDeviceProps = {
    deviceModel: DeviceModelInternal;
};

export const PinOnDevice = ({ deviceModel }: PinOnDeviceProps) => {
    const { applyStyle } = useNativeStyles();
    const { height: windowHeight } = useWindowDimensions();

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Text variant="headline-md" textAlign="center">
                <Translation id="moduleConnectDevice.pinScreen.title" />
            </Text>
            <Box alignItems="center" justifyContent="flex-end">
                <DevicePinImage
                    deviceModel={deviceModel}
                    maxHeight={windowHeight * DEVICE_IMAGE_MAX_HEIGHT_RATIO}
                />
                <ConnectorImage maxHeight={windowHeight * CONNECTOR_IMAGE_MAX_HEIGHT_RATIO} />
            </Box>
        </Box>
    );
};
