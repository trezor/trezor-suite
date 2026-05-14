import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { StoryContext } from '@storybook/react';

import {
    StylesProvider,
    createRenderer,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles-native';
import { ThemeColorVariant, prepareNativeTheme } from '@trezor/theme';

const renderer = createRenderer();

const storyContainerStyle = prepareNativeStyle(_ => ({
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
