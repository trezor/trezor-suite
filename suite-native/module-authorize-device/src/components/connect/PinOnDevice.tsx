import { Box, Text } from '@suite-native/atoms';
import { ConnectorImage } from '@suite-native/device';
import { DevicePinImage } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const DEVICE_IMAGE_MAX_HEIGHT = 0.42 * getScreenHeight();
const CONNECTOR_IMAGE_MAX_HEIGHT = 0.18 * getScreenHeight();

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

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Text variant="headline-md" textAlign="center">
                <Translation id="moduleConnectDevice.pinScreen.title" />
            </Text>
            <Box alignItems="center" justifyContent="flex-end">
                <DevicePinImage deviceModel={deviceModel} maxHeight={DEVICE_IMAGE_MAX_HEIGHT} />
                <ConnectorImage maxHeight={CONNECTOR_IMAGE_MAX_HEIGHT} />
            </Box>
        </Box>
    );
};
