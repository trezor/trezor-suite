import React, { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { useAtom, atom } from 'jotai';
import { Blur, Canvas, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Color, typographyStylesBase } from '@trezor/theme';
import { useNativeStyles } from '@trezor/styles';

import { Text, TextProps } from './Text';
import { Box } from './Box';

type DiscreetTextProps = TextProps & {
    children?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const satoshiFont = require('../../../packages/theme/fonts/TTSatoshi-Regular.otf');

const isDiscreetModeOn = atom(false);
export const useDiscreetMode = () => {
    const [isDiscreetMode, setIsDiscreetMode] = useAtom(isDiscreetModeOn);
    return {
        isDiscreetMode,
        setIsDiscreetMode,
    };
};

type DiscreetCanvasProps = {
    width: number;
    height: number;
    fontSize: number;
    text: string;
    color: Color;
};
const DiscreetCanvas = ({ width, height, fontSize, text, color }: DiscreetCanvasProps) => {
    const font = useFont(satoshiFont, fontSize);
    const {
        utils: { colors },
    } = useNativeStyles();
    if (!font) return null;

    return (
        <Canvas style={{ height, width }}>
            <SkiaText x={0} y={fontSize} text={text} font={font} color={colors[color]} />
            <Blur blur={15} mode="decal" />
        </Canvas>
    );
};

export const DiscreetText = ({
    children = '',
    color = 'textDefault',
    variant = 'body',
    ...restTextProps
}: DiscreetTextProps) => {
    const { isDiscreetMode } = useDiscreetMode();
    const [width, setWidth] = useState(0);

    const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
    };

    const { lineHeight, fontSize } = typographyStylesBase[variant];

    if (!children) return null;

    return (
        <Box>
            {isDiscreetMode ? (
                <DiscreetCanvas
                    width={width}
                    height={lineHeight}
                    fontSize={fontSize}
                    text={children}
                    color={color}
                />
            ) : (
                <Text variant={variant} color={color} onLayout={handleLayout} {...restTextProps}>
                    {children}
                </Text>
            )}
        </Box>
    );
};
