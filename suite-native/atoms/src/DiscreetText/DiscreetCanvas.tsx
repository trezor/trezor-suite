import { Blur, Canvas, useFont, Text as SkiaText } from '@shopify/react-native-skia';

import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const satoshiFont = require('../../../../packages/theme/fonts/TTSatoshi-Medium.otf');

type DiscreetCanvasProps = {
    width: number;
    height: number;
    fontSize: number;
    text: string;
    color: Color;
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
