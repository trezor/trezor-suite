import { Dimensions, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data: string;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

const MAX_QRCODE_SIZE = 250;
const QRCODE_PADDING = 24;

const QRCODE_SIZE =
    SCREEN_WIDTH < MAX_QRCODE_SIZE + QRCODE_PADDING ? SCREEN_WIDTH : MAX_QRCODE_SIZE;

const qrCodeContainerStyle = prepareNativeStyle(_ => ({
    width: QRCODE_SIZE + QRCODE_PADDING,
    height: QRCODE_SIZE + QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.surfaceFillRaised,
}));

export const QRCode = ({ data }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box alignItems="center">
            <View style={applyStyle(qrCodeContainerStyle)}>
                <ReactQRCode
                    bgColor={colorVariants.standard.surfaceFillRaised}
                    fgColor={colorVariants.standard.legacyBackgroundNeutralBold}
                    level="Q"
                    size={QRCODE_SIZE}
                    value={data}
                />
            </View>
        </Box>
    );
};
