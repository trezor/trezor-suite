import { type GestureResponderEvent, ScrollView } from 'react-native';

import { type Color, type NativeTypographyStyle, nativeTypography } from '@trezor/theme';

import { Box } from '../Box';
import { DiscreetCanvas } from '../DiscreetText/DiscreetCanvas';
import { useDiscreetFont } from '../DiscreetText/useDiscreetFont';
import { PressableOpacity } from '../Pressable';
import { getAccessibilityFontScale } from '../Text';

type BlurredUrlProps = {
    text: string;
    variant: NativeTypographyStyle;
    color: Color;
    isRevealed: boolean;
    onToggle: () => void;
};

export const BlurredUrl = ({ text, variant, color, isRevealed, onToggle }: BlurredUrlProps) => {
    const typography = nativeTypography[variant];
    const scale = getAccessibilityFontScale(variant);
    const fontSize = typography.fontSize * scale;
    const lineHeight = typography.lineHeight * scale;
    const font = useDiscreetFont(fontSize);
    const textWidth = font?.measureText(text).width ?? fontSize * text.length;
    // Text ellipsizes inline views as a whole. Keep long URLs compact so their blur remains visible.
    const width = Math.min(textWidth, fontSize * 6);

    const handlePress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onToggle();
    };

    // Inline views sit on the baseline; the taller canvas also leaves room for descenders.
    return (
        <Box
            style={{ width, height: fontSize }}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
        >
            <ScrollView
                style={{ position: 'absolute', top: 0, width, height: lineHeight }}
                horizontal
                scrollEnabled={isRevealed}
                showsHorizontalScrollIndicator={false}
            >
                <PressableOpacity
                    style={{ width: textWidth, height: lineHeight }}
                    onPress={handlePress}
                    accessible={false}
                >
                    <DiscreetCanvas
                        text={text}
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        color={color}
                        blur={(isRevealed ? 1 : 3) * scale}
                    />
                </PressableOpacity>
            </ScrollView>
        </Box>
    );
};
