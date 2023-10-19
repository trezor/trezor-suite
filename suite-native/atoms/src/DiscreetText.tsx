import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { useAtom } from 'jotai';
import { Blur, Canvas, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Color, typographyStylesBase } from '@trezor/theme';
import { mergeNativeStyleObjects, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { atomWithUnecryptedStorage } from '@suite-native/storage';

import { Text, TextProps } from './Text';
import { Box } from './Box';

type DiscreetTextProps = TextProps & {
    children?: string | null;
};

const satoshiFont = require('../../../packages/theme/fonts/TTSatoshi-Medium.otf');

const isDiscreetModeOn = atomWithUnecryptedStorage<boolean>('isDiscreetModeOn', false);
export const useDiscreetMode = () => {
    const [isDiscreetMode, setIsDiscreetMode] = useAtom(isDiscreetModeOn);

    const handleSetIsDiscreetMode = (value: boolean) => {
        setIsDiscreetMode(value);
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};

const discreetCanvasStyle = prepareNativeStyle<{ height: number; width: number }>(
    (_, { height, width }) => ({
        position: 'absolute',
        overflow: 'hidden',
        opacity: 0.7,
        borderRadius: height / 2,
        height,
        width,
    }),
);

type DiscreetCanvasProps = {
    width: number;
    height: number;
    fontSize: number;
    text: string;
    color: Color;
};
export const DiscreetCanvas = ({ width, height, fontSize, text, color }: DiscreetCanvasProps) => {
    const { applyStyle } = useNativeStyles();
    const font = useFont(satoshiFont, fontSize);
    const {
        utils: { colors },
    } = useNativeStyles();
    if (!font) return null;

    // Set blur dynamically to make look texts of any size look the same.
    const blurValue = height * 0.3;

    return (
        <Canvas style={applyStyle(discreetCanvasStyle, { height, width })}>
            <SkiaText y={fontSize} text={text} font={font} color={colors[color]} />
            <Blur blur={blurValue} mode="decal" />
        </Canvas>
    );
};
const discreetTextContainer = prepareNativeStyle<{ lineHeight: number }>((_, { lineHeight }) => ({
    height: lineHeight,
}));

const textTemplateStyle = prepareNativeStyle(_ => ({
    opacity: 0,
    height: 0,
}));

export const DiscreetText = ({
    children = '',
    color = 'textDefault',
    variant = 'body',
    ellipsizeMode,
    adjustsFontSizeToFit,
    style = {},
    ...restTextProps
}: DiscreetTextProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [width, setWidth] = useState(0);

    const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
    };

    const { lineHeight, fontSize } = typographyStylesBase[variant];

    if (!children) return null;

    if (!isDiscreetMode)
        return (
            <Text
                variant={variant}
                color={color}
                onLayout={handleLayout}
                ellipsizeMode={ellipsizeMode}
                adjustsFontSizeToFit={adjustsFontSizeToFit}
                style={style}
                {...restTextProps}
            >
                {children}
            </Text>
        );

    return (
        <Box style={applyStyle(discreetTextContainer, { lineHeight })}>
            <DiscreetCanvas
                width={width}
                height={lineHeight}
                fontSize={fontSize}
                text={children}
                color={color}
            />
            {/* Plain Text needs to be always rendered so it shares its width with DiscreetCanvas. */}
            {/* If the DiscreetMode is on, it is hidden with opacity and height set to zero. */}
            <Text
                ellipsizeMode={isDiscreetMode ? undefined : ellipsizeMode}
                adjustsFontSizeToFit={!isDiscreetMode && adjustsFontSizeToFit}
                variant={variant}
                color={color}
                onLayout={handleLayout}
                style={mergeNativeStyleObjects([style, applyStyle(textTemplateStyle)])}
                {...restTextProps}
            >
                {children}
            </Text>
        </Box>
    );
};
