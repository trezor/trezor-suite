import React, { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { useAtom, atom } from 'jotai';
import { Blur, Canvas, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Color, TypographyStyle, typographyStylesBase } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

type DiscreetCanvasProps = {
    width: number;
    height: number;
    fontSize: number;
    text: string;
};
const DiscreetCanvas = ({ width, height, fontSize, text }: DiscreetCanvasProps) => {
    const font = useFont(satoshiFont, fontSize);
    if (!font) return null;

    return (
        <Canvas style={{ height, width }}>
            <SkiaText x={0} y={fontSize} text={text} font={font} />
            <Blur blur={15} mode="decal" />
        </Canvas>
    );
};

const textStyle = prepareNativeStyle<{ isDiscreet: boolean }>((_, { isDiscreet }) => ({
    extend: {
        condition: isDiscreet,
        style: {
            opacity: 0,
            height: 0,
        },
    },
}));

type DiscreetValueProps = {
    onSetWidth: (width: number) => void;
    typography?: TypographyStyle;
    color?: Color;
    isDiscreet: boolean;
    text: string;
};
const DiscreetTextValue = ({
    onSetWidth,
    typography,
    isDiscreet,
    text,
    color,
}: DiscreetValueProps) => {
    const { applyStyle } = useNativeStyles();

    const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        onSetWidth(nativeEvent.layout.width);
    };

    return (
        <Box>
            <Text
                variant={typography}
                color={color}
                onLayout={handleLayout}
                style={applyStyle(textStyle, { isDiscreet })}
            >
                {text}
            </Text>
        </Box>
    );
};

export const DiscreetText = ({
    text,
    color = 'gray800',
    typography = 'body',
}: DiscreetTextProps) => {
    const [isDiscreetMode] = useAtom(isDiscreetModeOn);
    const [width, setWidth] = useState(20);

    const handleSetWidth = (textWidth: number) => {
        setWidth(textWidth);
    };

    const { lineHeight, fontSize } = typographyStylesBase[typography];

    return (
        <Box>
            <DiscreetTextValue
                color={color}
                onSetWidth={handleSetWidth}
                typography={typography}
                isDiscreet={isDiscreetMode}
                text={text}
            />
            {isDiscreetMode && (
                <DiscreetCanvas width={width} height={lineHeight} fontSize={fontSize} text={text} />
            )}
        </Box>
    );
};
