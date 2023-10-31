import { useEffect, useState } from 'react';
import { AppState, Dimensions, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import * as Brightness from 'expo-brightness';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';
import { colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data: string;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

const MAX_QRCODE_SIZE = 250;
const QRCODE_PADDING = 12;

const QRCODE_SIZE =
    SCREEN_WIDTH < MAX_QRCODE_SIZE + QRCODE_PADDING ? SCREEN_WIDTH : MAX_QRCODE_SIZE;

const qrCodeContainerStyle = prepareNativeStyle(_ => ({
    width: QRCODE_SIZE + QRCODE_PADDING,
    height: QRCODE_SIZE + QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.backgroundSurfaceElevation1,
}));

export const QRCode = ({ data }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();
    const [originalBrightnessValue, setOriginalBrightnessValue] = useState<number>();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (!originalBrightnessValue) return;

            // When app goes to background, restore the original brightness value.
            if (nextAppState === 'background') {
                Brightness.setBrightnessAsync(originalBrightnessValue);
            }
            // When app goes to foreground set full brightness.
            if (nextAppState === 'active') {
                Brightness.setBrightnessAsync(1);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [originalBrightnessValue]);

    useEffect(() => {
        const storeBrightnessValue = async () => {
            const brightnessValue = await Brightness.getBrightnessAsync();
            setOriginalBrightnessValue(brightnessValue);
        };

        // Set brightness to maximum and store the original value.
        storeBrightnessValue();
        Brightness.setBrightnessAsync(1);
    }, []);

    useEffect(
        // Restore the original brightness value when the QR code is unmounted.
        () => () => {
            if (originalBrightnessValue) Brightness.setBrightnessAsync(originalBrightnessValue);
        },
        [originalBrightnessValue],
    );

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
        </Box>
    );
};
