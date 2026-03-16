import { type ReactNode } from 'react';
import { RendererProvider, ThemeProvider } from 'react-fela';

import { type IRenderer } from 'fela';

import { type NativeTheme, type Theme } from '@trezor/theme';

import { DirectionContext } from './contexts';
import { type Direction } from './types';

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
