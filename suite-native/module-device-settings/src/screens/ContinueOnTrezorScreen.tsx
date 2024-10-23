import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { ConnectorImage, DeviceImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

const SCREEN_HEIGHT = getScreenHeight();

const titleStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp12,
    textAlign: 'center',
}));

export const ContinueOnTrezorScreen = () => {
    const { applyStyle } = useNativeStyles();

    const deviceModel = useSelector(selectDeviceModel);

    if (!deviceModel) {
        return null;
    }

    return (
        <DeviceInteractionScreenWrapper>
            <Text variant="titleMedium" style={applyStyle(titleStyle)}>
                <Translation id="device.title.continueOnTrezor" />
            </Text>
            <Box flex={1} alignItems="center" justifyContent="flex-end">
                <DeviceImage
                    deviceModel={deviceModel}
                    size="large"
                    maxHeight={0.42 * SCREEN_HEIGHT}
                />
                <ConnectorImage maxHeight={0.18 * SCREEN_HEIGHT} />
            </Box>
        </DeviceInteractionScreenWrapper>
    );
};
