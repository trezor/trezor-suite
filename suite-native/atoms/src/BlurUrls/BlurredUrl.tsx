import { type Color, type NativeTypographyStyle, nativeTypography } from '@trezor/theme';

import { Box } from '../Box';
import { DiscreetCanvas } from '../DiscreetText/DiscreetCanvas';
import { useDiscreetFont } from '../DiscreetText/useDiscreetFont';
import { getAccessibilityFontScale } from '../Text';

type BlurredUrlProps = {
    text: string;
    variant: NativeTypographyStyle;
    color: Color;
};

export const BlurredUrl = ({ text, variant, color }: BlurredUrlProps) => {
    const typography = nativeTypography[variant];
    const scale = getAccessibilityFontScale(variant);
    const fontSize = typography.fontSize * scale;
    const lineHeight = typography.lineHeight * scale;
    const font = useDiscreetFont(fontSize);
    // Text ellipsizes inline views as a whole. Keep long URLs compact so their blur remains visible.
    const width = Math.min(font?.measureText(text).width ?? fontSize * text.length, fontSize * 6);

    return (
        <Box
            style={{ width, height: lineHeight }}
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
        >
            <DiscreetCanvas text={text} fontSize={fontSize} lineHeight={lineHeight} color={color} />
        </Box>
    );
};
