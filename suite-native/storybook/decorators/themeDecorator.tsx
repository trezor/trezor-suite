import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { StoryContext } from '@storybook/react';

import { StylesProvider, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { createRenderer } from '@trezor/styles/src/createRenderer.native';
import { ThemeColorVariant, prepareNativeTheme } from '@trezor/theme';

const renderer = createRenderer();

const storyContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    ...StyleSheet.absoluteFillObject,
}));

const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(storyContainerStyle)}>{children}</View>;
};

export const themeDecorator = (Story: React.FC, context: StoryContext) => {
    const themeVariant = Platform.select({
        web: context.globals.theme,
        native: context.args.theme, // native storybook does not have support for global types UI.
    }) as ThemeColorVariant;

    const theme = prepareNativeTheme({ colorVariant: themeVariant });

    return (
        <StylesProvider renderer={renderer} theme={theme}>
            <ThemeWrapper>
                <Story />
            </ThemeWrapper>
        </StylesProvider>
    );
};
