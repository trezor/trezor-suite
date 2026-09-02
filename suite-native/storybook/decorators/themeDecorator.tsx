import React from 'react';
import { Platform } from 'react-native';

import { StoryContext } from '@storybook/react';

import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { ThemeColorVariant, prepareNativeTheme } from '@trezor/theme';

const renderer = createRenderer();

export const themeDecorator = (Story: React.FC, context: StoryContext) => {
    const themeVariant = Platform.select({
        web: context.globals.theme,
        native: context.args.theme, // native storybook does not have support for global types UI.
    }) as ThemeColorVariant;

    const theme = prepareNativeTheme({ colorVariant: themeVariant });

    return (
        <StylesProvider renderer={renderer} theme={theme}>
            <Story />
        </StylesProvider>
    );
};
