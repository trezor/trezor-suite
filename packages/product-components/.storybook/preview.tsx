import React from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { StoryContext, StoryFn } from '@storybook/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';
import { ServicesProvider } from '@trezor/dependency-injection';

import { storyServices, storyState } from '../src/components/TokenIcon/storyFixtures';

const services = {
    ...storyServices,
    store: configureStore({ reducer: () => storyState }),
};

export const globalTypes = {
    mode: {
        defaultValue: 'light',
    },
};
export const decorators = [
    (Story: StoryFn, context: StoryContext) => {
        const mode = context.globals.mode ?? 'light';

        const theme =
            mode === 'light'
                ? { ...intermediaryTheme.light, variant: 'light' }
                : { ...intermediaryTheme.dark, variant: 'dark' };

        return (
            <Provider store={services.store}>
                <ServicesProvider services={services}>
                    <ThemeProvider theme={theme}>
                        <div
                            style={{
                                padding: 32,
                                background: theme.surfaceFillPage,
                                color: theme.contentPrimary,
                                boxSizing: 'border-box',
                                height: '100vh',
                                overflow: 'auto',
                            }}
                        >
                            {Story(context.args, context)}
                        </div>
                    </ThemeProvider>
                </ServicesProvider>
            </Provider>
        );
    },
];

export const parameters = {
    layout: 'fullscreen',
    options: {
        showPanel: true,
        showInfo: true,
        panelPosition: 'right',
        storySort: {
            order: ['*'],
            method: 'alphabetical',
            locales: 'cs',
        },
    },
    theme: {
        base: 'light',
    },
};
