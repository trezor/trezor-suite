import React, { ReactNode } from 'react';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

type VStackProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

type SpacerStyleProps = {
    isLastChild: boolean;
};

const spacerStyle = prepareNativeStyle<SpacerStyleProps>((utils, { isLastChild }) => ({
    extend: {
        condition: isLastChild,
        style: {
            marginBottom: utils.spacings.small,
        },
    },
}));

export const VStack = ({ children, style }: VStackProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={style}>
            {React.Children?.map(children, (child, index) => (
                <>
                    <Box>{child}</Box>
                    <Box
                        style={applyStyle(spacerStyle, {
                            isLastChild: index < React.Children.count(children) - 1,
                        })}
                    />
                </>
            ))}
        </Box>
    );
};
