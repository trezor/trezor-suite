import { Dimensions, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { Box, nativeSpacingToNumber } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing, colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data: string;
    qrCodeSize?: number;
    paddingHorizontal?: NativeSpacing;
    paddingVertical?: NativeSpacing;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

const MAX_QRCODE_SIZE = 250;
const QRCODE_PADDING = 24;

const QRCODE_SIZE =
    SCREEN_WIDTH < MAX_QRCODE_SIZE + QRCODE_PADDING ? SCREEN_WIDTH : MAX_QRCODE_SIZE;

const getQRCodePadding = (padding: NativeSpacing | undefined) =>
    padding === undefined ? QRCODE_PADDING : nativeSpacingToNumber(padding) * 2;

const qrCodeContainerStyle = prepareNativeStyle<{
    qrCodeSize: number;
    paddingHorizontal: number;
    paddingVertical: number;
}>((_, { qrCodeSize, paddingHorizontal, paddingVertical }) => ({
    width: qrCodeSize + paddingHorizontal,
    height: qrCodeSize + paddingVertical,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.surfaceFillRaised,
}));

export const QRCode = ({
    data,
    qrCodeSize = QRCODE_SIZE,
    paddingHorizontal,
    paddingVertical,
}: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    const horizontalPadding = getQRCodePadding(paddingHorizontal);
    const verticalPadding = getQRCodePadding(paddingVertical);

    return (
        <Box alignItems="center">
            <View
                style={applyStyle(qrCodeContainerStyle, {
                    qrCodeSize,
                    paddingVertical: verticalPadding,
                    paddingHorizontal: horizontalPadding,
                })}
            >
                <ReactQRCode
                    bgColor={colorVariants.standard.surfaceFillRaised}
                    fgColor={colorVariants.standard.legacyBackgroundNeutralBold}
                    level="Q"
                    size={qrCodeSize}
                    value={data}
                />
            </View>
        </Box>
    );
};
