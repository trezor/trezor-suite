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

const textStyle = prepareNativeStyle((_, { isDiscreetMode }) => ({
    opacity: isDiscreetMode ? 0 : 1,
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
    const [height, setHeight] = useState(0);

    const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
        setHeight(nativeEvent.layout.height);
    };

    const { fontSize } = typographyStylesBase[variant];
    if (!children) return null;

    return (
        <Box>
            {isDiscreetMode && (
                <DiscreetCanvas
                    width={width}
                    height={height}
                    fontSize={fontSize}
                    text={children}
                    color={color}
                />
            )}

            {/* Plain Text needs to be always rendered so it shares its width with DiscreetCanvas. */}
            {/* If the DiscreetMode is on, it is hidden with opacity set to zero. */}
            <Box onLayout={handleLayout}>
                <Text
                    variant={variant}
                    color={color}
                    ellipsizeMode={ellipsizeMode}
                    adjustsFontSizeToFit={adjustsFontSizeToFit}
                    style={mergeNativeStyleObjects([
                        style,
                        applyStyle(textStyle, { isDiscreetMode }),
                    ])}
                    {...restTextProps}
                >
                    {children}
                </Text>
            </Box>
        </Box>
    );
};
