import { ReactNode } from 'react';
import { RendererProvider, ThemeProvider } from 'react-fela';

import { IRenderer } from 'fela';

import { NativeTheme, Theme } from '@trezor/theme';

import { Direction } from './types';
import { DirectionContext } from './contexts';

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
