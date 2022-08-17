import React, { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NativeSpacing } from '@trezor/theme';

import { Box, BoxProps } from './Box';

interface HStackProps extends BoxProps {
    children: ReactNode;
    spacing?: NativeSpacing | number;
}

type SpacerStyleProps = {
    isLastChild: boolean;
    spacing?: NativeSpacing | number;
};

const spacerStyle = prepareNativeStyle<SpacerStyleProps>((utils, { isLastChild, spacing }) => {
    const spacingValue = typeof spacing === 'number' ? spacing : utils.spacings[spacing ?? 'small'];
    return {
        extend: {
            condition: !isLastChild,
            style: {
                marginRight: spacingValue,
            },
        },
    };
});

export const HStack = ({ children, style, spacing, ...rest }: HStackProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" style={style} {...rest}>
            {React.Children?.map(children, (child, index) => (
                <Box
                    flex={1}
                    style={applyStyle(spacerStyle, {
                        isLastChild: index === React.Children.count(children) - 1,
                        spacing,
                    })}
                >
                    {child}
                </Box>
            ))}
        </Box>
    );
};
