import { Dimensions, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { Box, nativeSpacingToNumber } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing, colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data: string;
    size?: number;
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
    size: number;
    paddingHorizontal: number;
    paddingVertical: number;
}>((_, { size, paddingHorizontal, paddingVertical }) => ({
    width: size + paddingHorizontal,
    height: size + paddingVertical,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.surfaceFillRaised,
}));

export const QRCode = ({
    data,
    size = QRCODE_SIZE,
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
                    size,
                    paddingVertical: verticalPadding,
                    paddingHorizontal: horizontalPadding,
                })}
            >
                <ReactQRCode
                    bgColor={colorVariants.standard.surfaceFillRaised}
                    fgColor={colorVariants.standard.legacyBackgroundNeutralBold}
                    level="Q"
                    size={size}
                    value={data}
                />
            </View>
        </Box>
    );
};
