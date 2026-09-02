import { type ReactElement } from 'react';
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
    centerIcon?: ReactElement;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

const MAX_QRCODE_SIZE = 250;
const QRCODE_PADDING = 24;

const QRCODE_SIZE =
    SCREEN_WIDTH < MAX_QRCODE_SIZE + QRCODE_PADDING ? SCREEN_WIDTH : MAX_QRCODE_SIZE;

// 25% squared equals 4% total covered area, which is well within safe limits for
// "High" level QR code.
const QR_CENTER_ICON_MAX_RATIO = '25%';
const QR_CENTER_ICON_PADDING = 4;

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

const qrCodeCenterIconWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
}));

const qrCodeCenterIconStyle = prepareNativeStyle(utils => ({
    maxWidth: QR_CENTER_ICON_MAX_RATIO,
    maxHeight: QR_CENTER_ICON_MAX_RATIO,
    padding: QR_CENTER_ICON_PADDING,
    borderRadius: utils.borders.radii.round,
    overflow: 'hidden',
    backgroundColor: colorVariants.standard.surfaceFillRaised,
}));

export const QRCode = ({
    data,
    qrCodeSize = QRCODE_SIZE,
    paddingHorizontal,
    paddingVertical,
    centerIcon,
}: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    const horizontalPadding = getQRCodePadding(paddingHorizontal);
    const verticalPadding = getQRCodePadding(paddingVertical);
    const hasCenterIcon = centerIcon !== undefined;

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
                    fgColor={colorVariants.standard.elementFillContrast}
                    level={hasCenterIcon ? 'H' : 'Q'}
                    size={qrCodeSize}
                    value={data}
                />
                {hasCenterIcon && (
                    <View pointerEvents="none" style={applyStyle(qrCodeCenterIconWrapperStyle)}>
                        <View style={applyStyle(qrCodeCenterIconStyle)}>{centerIcon}</View>
                    </View>
                )}
            </View>
        </Box>
    );
};
