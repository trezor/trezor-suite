import React, { ReactNode } from 'react';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NativeSpacing } from '@trezor/theme';

import { Box } from './Box';

type VStackProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    spacing: NativeSpacing;
};

type SpacerStyleProps = {
    isLastChild: boolean;
    spacing: NativeSpacing;
};

const spacerStyle = prepareNativeStyle<SpacerStyleProps>((utils, { isLastChild, spacing }) => ({
    extend: {
        condition: !isLastChild,
        style: {
            marginBottom: utils.spacings[spacing],
        },
    },
}));

export const VStack = ({ children, style, spacing }: VStackProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={style}>
            {React.Children?.map(children, (child, index) => (
                <>
                    <Box
                        style={applyStyle(spacerStyle, {
                            isLastChild: index === React.Children.count(children) - 1,
                            spacing,
                        })}
                    >
                        {child}
                    </Box>
                </>
            ))}
        </Box>
    );
};
