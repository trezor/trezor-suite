import React from 'react';

import { A, pipe } from '@mobily/ts-belt';
import { Canvas, LinearGradient, vec, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Text, Box, VStack, Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { splitAddressToChunks } from '@suite-native/helpers';

type DeviceScreenAddressProps = {
    address: string;
    isAddressVisible: boolean;
};

const DEVICE_SCREEN_BACKGROUND_COLOR = '#000000';
const DEVICE_TEXT_COLOR = '#FFFFFF';
const FONT_SIZE = 18;
const LINE_HEIGHT = 24;

const deviceFrameStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.large / 2,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.small,

    padding: utils.spacings.extraSmall,
}));

const deviceScreenStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.large / 2,
    backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    padding: 40,
}));

const AddressLineGradient = ({ isApplied }: { isApplied: boolean }) => (
    <LinearGradient
        start={vec(50, 0)}
        end={vec(50, FONT_SIZE * 3.5)}
        colors={[DEVICE_TEXT_COLOR, isApplied ? DEVICE_SCREEN_BACKGROUND_COLOR : DEVICE_TEXT_COLOR]}
    />
);

export const DeviceScreenAddress = ({ address, isAddressVisible }: DeviceScreenAddressProps) => {
    const { applyStyle } = useNativeStyles();

    const chunkedAddress = pipe(address, splitAddressToChunks, A.splitEvery(4));

    const satoshiFont = require('../../../../packages/theme/fonts/RobotoMono-Regular.ttf');

    const font = useFont(satoshiFont, FONT_SIZE);

    return (
        <VStack spacing={16}>
            <Box style={applyStyle(deviceFrameStyle)}>
                <Box style={applyStyle(deviceScreenStyle)}>
                    <Canvas style={{ width: 210, height: chunkedAddress.length * LINE_HEIGHT }}>
                        {chunkedAddress.map((line, index) => {
                            if (!isAddressVisible && index > 1) return null;

                            const isLineFaded = !isAddressVisible && index === 1;
                            const lineString = line.join(' ');

                            return (
                                <SkiaText
                                    key={lineString}
                                    x={0}
                                    y={(index + 1) * LINE_HEIGHT}
                                    text={lineString}
                                    font={font}
                                    color={DEVICE_TEXT_COLOR}
                                >
                                    <AddressLineGradient isApplied={isLineFaded} />
                                </SkiaText>
                            );
                        })}
                    </Canvas>
                </Box>
            </Box>
            <Text variant="hint" color="textSubdued" textAlign="center">
                The receive address shown above should match the one on your Trezor device.
            </Text>
            <Box flexDirection="row" flexShrink={1} justifyContent="center">
                <Button size="small" colorScheme="tertiaryElevation1">
                    Address doesn't match?
                </Button>
            </Box>
        </VStack>
    );
};
