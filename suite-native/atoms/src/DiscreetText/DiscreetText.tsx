import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { mergeNativeStyleObjects, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeTypography } from '@trezor/theme';

import { Box } from '../Box';
import { Text, TextProps } from '../Text';
import { DiscreetCanvas } from './DiscreetCanvas';
import { useDiscreetMode } from './useDiscreetMode';

export type DiscreetTextProps = TextProps & {
    children?: string | null;
    isForcedDiscreetMode?: boolean;
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
    isForcedDiscreetMode,
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

    const { fontSize } = nativeTypography[variant];
    if (!children) return null;
    const showAsDiscreet = isDiscreetMode || !!isForcedDiscreetMode;

    return (
        <Box>
            {showAsDiscreet && (
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
                    testID={showAsDiscreet ? 'discreet-text' : 'plain-text'}
                    variant={variant}
                    color={color}
                    ellipsizeMode={ellipsizeMode}
                    adjustsFontSizeToFit={adjustsFontSizeToFit}
                    style={mergeNativeStyleObjects([
                        style,
                        applyStyle(textStyle, { isDiscreetMode: showAsDiscreet }),
                    ])}
                    {...restTextProps}
                >
                    {children}
                </Text>
            </Box>
        </Box>
    );
};
