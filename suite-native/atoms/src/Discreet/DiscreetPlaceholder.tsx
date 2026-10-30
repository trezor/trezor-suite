import { Platform } from 'react-native';

import { BlurMask, Canvas, Text as SkiaText, matchFont } from '@shopify/react-native-skia';

import { DISCREET_PLACEHOLDER } from '@suite-common/discreet-mode';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

import { Box } from '../Box';
import { getAccessibilityFontScale } from '../Text';

type DiscreetPlaceholderProps = {
    color: Color;
    variant: NativeTypographyStyle;
    blurIntensity: number;
};

const containerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const DiscreetPlaceholder = ({
    color,
    variant,
    blurIntensity,
}: DiscreetPlaceholderProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const fontSize = utils.typography[variant].fontSize * getAccessibilityFontScale(variant);
    const font = matchFont({
        fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
        fontSize,
    });
    const bounds = font.measureText(DISCREET_PLACEHOLDER);
    const padding = blurIntensity * 3;

    return (
        <Box
            style={applyStyle(containerStyle)}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="discreet-placeholder"
        >
            <Canvas
                style={{ width: bounds.width + padding * 2, height: bounds.height + padding * 2 }}
            >
                <SkiaText
                    text={DISCREET_PLACEHOLDER}
                    font={font}
                    x={padding - bounds.x}
                    y={padding - bounds.y}
                    color={utils.colors[color]}
                >
                    <BlurMask blur={blurIntensity} style="normal" />
                </SkiaText>
            </Canvas>
        </Box>
    );
};
