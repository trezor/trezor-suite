import { Blur, Canvas, Text as SkiaText } from '@shopify/react-native-skia';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { useDiscreetFont } from './useDiscreetFont';

type DiscreetCanvasProps = {
    fontSize: number;
    lineHeight: number;
    text: string;
    color: Color;
};

const discreetCanvasStyle = prepareNativeStyle<{ lineHeight: number }>((_, { lineHeight }) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    opacity: 0.7,
    borderRadius: lineHeight / 2,
}));

export const DiscreetCanvas = ({ fontSize, lineHeight, text, color }: DiscreetCanvasProps) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const font = useDiscreetFont(fontSize);

    if (!font) return null;

    // Set blur dynamically so texts of any size look the same.
    const blurValue = lineHeight * 0.3;

    return (
        <Canvas style={applyStyle(discreetCanvasStyle, { lineHeight })} pointerEvents="none">
            <SkiaText y={fontSize} text={text} font={font} color={colors[color]}>
                <Blur blur={blurValue} mode="decal" />
            </SkiaText>
        </Canvas>
    );
};
