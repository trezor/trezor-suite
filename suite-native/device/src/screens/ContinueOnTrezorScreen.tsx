import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import TrezorConnect from '@trezor/connect';

import { ConnectorImage } from '../components/ConnectorImage';
import { DeviceImage } from '../components/DeviceImage';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

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
