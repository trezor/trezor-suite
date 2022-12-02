import React, { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { useAtom, atom } from 'jotai';
import { Blur, Canvas, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Color, TypographyStyle, typographyStylesBase } from '@trezor/theme';

import { Text } from './Text';
import { Box } from './Box';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const satoshiFont = require('../../../packages/theme/fonts/TTSatoshi-Regular.otf');

type DiscreetTextProps = {
    typography?: TypographyStyle;
    color?: Color;
    text: string;
};

export const isDiscreetModeOn = atom(true);

const DiscreetCanvas = ({
    width,
    height,
    fontSize,
    text,
}: {
    width: number;
    height: number;
    fontSize: number;
    text: string;
}) => {
    const font = useFont(satoshiFont, fontSize);
    if (!font) return null;

    return (
        <Canvas style={{ height, width }}>
            <SkiaText x={0} y={fontSize} text={text} font={font} />
            <Blur blur={15} mode="decal" />
        </Canvas>
    );
};

export const DiscreetText = ({
    text,
    color = 'gray800',
    typography = 'body',
}: DiscreetTextProps) => {
    const [isDiscreetMode] = useAtom(isDiscreetModeOn);
    const [width, setWidth] = useState(50);
    const { lineHeight, fontSize } = typographyStylesBase[typography];

    const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
    };

    return (
        <Box>
            {isDiscreetMode ? (
                <DiscreetCanvas width={width} height={lineHeight} fontSize={fontSize} text={text} />
            ) : (
                <Text variant={typography} color={color} onLayout={handleLayout}>
                    {text}
                </Text>
            )}
        </Box>
    );
};
