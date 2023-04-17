import React from 'react';
import { View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data: string;
};

export const QRCODE_SIZE = 197;
export const QRCODE_PADDING = 12;

const qrCodeContainerStyle = prepareNativeStyle(_ => ({
    width: QRCODE_SIZE + QRCODE_PADDING,
    height: QRCODE_SIZE + QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.backgroundSurfaceElevation1,
}));

export const QRCode = ({ data }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box alignItems="center">
            <View style={applyStyle(qrCodeContainerStyle)}>
                <ReactQRCode
                    bgColor={colorVariants.standard.backgroundSurfaceElevation1}
                    fgColor={colorVariants.standard.backgroundNeutralBold}
                    level="Q"
                    size={QRCODE_SIZE}
                    value={data}
                />
            </View>

            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="body">{data}</Text>
            </Box>
        </Box>
    );
};
