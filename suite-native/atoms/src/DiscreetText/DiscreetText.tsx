import { useEffect } from 'react';

import { useDiscreetMode } from '@suite-common/discreet-mode';
import {
    mergeNativeStyleObjects,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles-native';
import { nativeTypography } from '@trezor/theme';

import { Box } from '../Box';
import { Text, type TextProps } from '../Text';
import { DiscreetCanvas } from './DiscreetCanvas';
import { preloadDiscreetFont } from './useDiscreetFont';

export type DiscreetTextProps = TextProps & {
    children?: string | null;
    isForcedDiscreetMode?: boolean;
};

const textStyle = prepareNativeStyle((_, { isDiscreetMode }) => ({
    opacity: isDiscreetMode ? 0 : 1,
}));

export const DiscreetText = ({
    children = '',
    color = 'contentPrimary',
    variant = 'body-md',
    ellipsizeMode,
    adjustsFontSizeToFit,
    style = {},
    isForcedDiscreetMode,
    ...restTextProps
}: DiscreetTextProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();

    // Warm the Skia typeface cache up front so the first discreet-mode toggle
    // paints the blurred canvas immediately instead of flashing blank.
    useEffect(() => {
        preloadDiscreetFont();
    }, []);

    const { fontSize, lineHeight } = nativeTypography[variant];
    if (!children) return null;
    const showAsDiscreet = isDiscreetMode || !!isForcedDiscreetMode;

    return (
        <Box>
            {showAsDiscreet && (
                <DiscreetCanvas
                    fontSize={fontSize}
                    lineHeight={lineHeight}
                    text={children}
                    color={color}
                />
            )}

            {/* Plain Text always sizes the parent that the DiscreetCanvas fills. */}
            {/* If the DiscreetMode is on, it is hidden with opacity set to zero. */}
            <Box>
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
