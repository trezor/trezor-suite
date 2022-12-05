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

type TextValueProps = {
    onSetWidth: (width: number) => void;
    typography?: TypographyStyle;
    color?: Color;
    isDiscreet: boolean;
    children: string;
};
const TextValue = ({ onSetWidth, typography, isDiscreet, color, children }: TextValueProps) => {
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
                {children}
            </Text>
        </Box>
    );
};

type DiscreetTextProps = {
    typography?: TypographyStyle;
    color?: Color;
    children: string;
};
export const DiscreetText = ({
    children,
    color = 'gray800',
    typography = 'body',
}: DiscreetTextProps) => {
    const [isDiscreetMode] = useAtom(isDiscreetModeOn);
    const [width, setWidth] = useState(0);

    const { lineHeight, fontSize } = typographyStylesBase[typography];

    return (
        <Box>
            <TextValue
                color={color}
                onSetWidth={setWidth}
                typography={typography}
                isDiscreet={isDiscreetMode}
            >
                {children}
            </TextValue>
            {isDiscreetMode && (
                <DiscreetCanvas
                    width={width}
                    height={lineHeight}
                    fontSize={fontSize}
                    text={children}
                />
            )}
        </Box>
    );
};
