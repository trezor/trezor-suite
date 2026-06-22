import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { StoryContext } from 'storybook/internal/csf';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const storyContainerStyle = prepareNativeStyle<{ disablePaddingHorizontal: boolean }>(
    (utils, { disablePaddingHorizontal }) => ({
        flex: 1,
        paddingTop: utils.spacings.sp32,
        paddingHorizontal: disablePaddingHorizontal ? 0 : utils.spacings.sp16,
        backgroundColor: utils.colors.surfaceFillPage,
        ...StyleSheet.absoluteFillObject,
    }),
);

const LayoutWrapper = ({
    children,
    disablePaddingHorizontal,
}: {
    children: React.ReactNode;
    disablePaddingHorizontal: boolean;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(storyContainerStyle, { disablePaddingHorizontal })}>
            {children}
        </View>
    );
};

export const layoutDecorator = (Story: React.FC, context: StoryContext) => (
    <LayoutWrapper
        disablePaddingHorizontal={context.parameters.layout?.disablePaddingHorizontal ?? false}
    >
        <Story />
    </LayoutWrapper>
);
