import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { ConnectorImage, DeviceImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const SCREEN_HEIGHT = getScreenHeight();

const titleStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp12,
    textAlign: 'center',
}));

export const ContinueOnTrezorScreen = () => {
    const { applyStyle } = useNativeStyles();

    const deviceModel = useSelector(selectDeviceModel);

    const closeAction = useCallback(() => TrezorConnect.cancel(), []);

    if (!deviceModel) {
        return null;
    }

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    customHorizontalPadding="sp16"
                    closeActionType="close"
                    closeAction={closeAction}
                />
            }
            customHorizontalPadding="sp24"
            hasBottomInset={false}
            isScrollable={false}
        >
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
        </Screen>
    );
};
