import React, { useContext } from 'react';
import { Dimensions, View, StyleSheet, StatusBar } from 'react-native';

import { BackdropBlur, Canvas, Fill, Image } from '@shopify/react-native-skia';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ScreenshotContext } from './ScreenshotProvider';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 0;

type BlurredScreenOverlayProps = {
    isDimmed?: boolean;
    blurValue?: number;
};

const canvasStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const BlurredScreenOverlay = ({
    isDimmed = true,
    blurValue = 4,
}: BlurredScreenOverlayProps) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();

    const { screenshot } = useContext(ScreenshotContext);

    if (!screenshot) return null;

    const overlayHeight = SCREEN_HEIGHT - STATUS_BAR_HEIGHT;

    return (
        <View style={StyleSheet.absoluteFillObject}>
            <Canvas style={applyStyle(canvasStyle)}>
                <Image
                    image={screenshot}
                    x={0}
                    y={0}
                    height={overlayHeight}
                    width={SCREEN_WIDTH}
                    fit="fill"
                />
                <BackdropBlur
                    blur={blurValue}
                    clip={{
                        x: 0,
                        y: 0,
                        height: SCREEN_HEIGHT,
                        width: SCREEN_WIDTH,
                    }}
                >
                    {isDimmed && <Fill color={colors.backgroundNeutralBold} opacity={0.1} />}
                </BackdropBlur>
            </Canvas>
        </View>
    );
};
