import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { typographyStylesBase } from '@trezor/theme';
import { mergeNativeStyleObjects, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Text, TextProps } from '../Text';
import { Box } from '../Box';
import { DiscreetCanvas } from './DiscreetCanvas';
import { useDiscreetMode } from './useDiscreetMode';

export type DiscreetTextProps = TextProps & {
    children?: string | null;
};

const discreetTextContainer = prepareNativeStyle<{ lineHeight: number }>((_, { lineHeight }) => ({
    height: lineHeight,
    justifyContent: 'center',
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
            <Box style={applyStyle(discreetTextContainer, { lineHeight })}>
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
            </Box>
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
