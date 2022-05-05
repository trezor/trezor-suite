import React, { ReactNode } from 'react';

import { NativeTheme, Theme } from '@trezor/theme';
import { IRenderer } from 'fela';
import { RendererProvider, ThemeProvider } from 'react-fela';

import { DirectionContext } from './contexts';
import { Direction } from './types';

export interface StylesProviderProps {
    children: ReactNode;
    direction?: Direction;
    renderer: IRenderer;
    theme: Theme | NativeTheme;
}

export const StylesProvider = ({
    children,
    direction = 'ltr',
    renderer,
    theme,
}: StylesProviderProps) => (
    <RendererProvider renderer={renderer}>
        <ThemeProvider theme={theme}>
            <DirectionContext.Provider value={direction}>{children}</DirectionContext.Provider>
        </ThemeProvider>
    </RendererProvider>
);
