import React from 'react';

import { A, pipe } from '@mobily/ts-belt';
import { Canvas, LinearGradient, vec, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { splitAddressToChunks } from '@suite-native/helpers';

import { UnverifiedAddressDeviceHint } from './UnverifiedAddressDeviceHint';

type DeviceScreenAddressProps = {
    address: string;
    isAddressRevealed: boolean;
};

// TODO: these values will differ according to the used device model
// more: https://github.com/trezor/trezor-suite/issues/9778
const DEVICE_SCREEN_BACKGROUND_COLOR = '#000000';
const DEVICE_TOP_PADDING = 30;
const DEVICE_SCREEN_WIDTH = 340;
const DEVICE_SCREEN_HEIGHT = 150;
const DEVICE_TEXT_COLOR = '#FFFFFF';
const FONT_SIZE = 18;
const LINE_HEIGHT = 32;
const LINE_WIDTH = 210;
const FADEOUT_GRADIENT_CENTER = LINE_WIDTH / 2;
const FADEOUT_GRADIENT_HEIGHT = LINE_HEIGHT * 2.75;

const deviceFrameStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.extraSmall,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.large / 2,
    borderColor: utils.colors.borderOnElevation1,
}));

const deviceScreenStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: DEVICE_SCREEN_WIDTH,
    backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
    borderRadius: utils.borders.radii.large / 2,

    paddingVertical: DEVICE_TOP_PADDING,
}));

const deviceContentCanvasStyle = prepareNativeStyle(_ => ({
    width: LINE_WIDTH,
    height: DEVICE_SCREEN_HEIGHT,
}));

const AddressLineGradient = ({ isApplied }: { isApplied: boolean }) => (
    <LinearGradient
        start={vec(FADEOUT_GRADIENT_CENTER, 0)}
        end={vec(FADEOUT_GRADIENT_CENTER, FADEOUT_GRADIENT_HEIGHT)}
        colors={[DEVICE_TEXT_COLOR, isApplied ? DEVICE_SCREEN_BACKGROUND_COLOR : DEVICE_TEXT_COLOR]}
    />
);

export const UnverifiedAddressDevice = ({
    address,
    isAddressRevealed,
}: DeviceScreenAddressProps) => {
    const { applyStyle } = useNativeStyles();

    const addressChunkedLines = pipe(address, splitAddressToChunks, A.splitEvery(4));

    const deviceFont = useFont(
        require('../../../../packages/theme/fonts/RobotoMono-Regular.ttf'),
        FONT_SIZE,
    );

    return (
        <VStack spacing="medium">
            <Box style={applyStyle(deviceFrameStyle)}>
                <Box style={applyStyle(deviceScreenStyle)}>
                    <Canvas style={applyStyle(deviceContentCanvasStyle)}>
                        {addressChunkedLines.map((line, index) => {
                            // hide all lines following the one with fade out gradient.
                            if (!isAddressRevealed && index > 1) return null;

                            const isLineFaded = !isAddressRevealed && index === 1;
                            const lineString = line.join(' ');

                            return (
                                <SkiaText
                                    key={lineString}
                                    x={0}
                                    y={(index + 1) * LINE_HEIGHT}
                                    text={lineString}
                                    font={deviceFont}
                                    color={DEVICE_TEXT_COLOR}
                                >
                                    <AddressLineGradient isApplied={isLineFaded} />
                                </SkiaText>
                            );
                        })}
                    </Canvas>
                </Box>
            </Box>
            {isAddressRevealed && <UnverifiedAddressDeviceHint />}
        </VStack>
    );
};
