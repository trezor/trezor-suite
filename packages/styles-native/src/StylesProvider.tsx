import { type ReactNode } from 'react';
import { RendererProvider, ThemeProvider } from 'react-fela';

import { type IRenderer } from 'fela';

import { type Direction, DirectionContext } from '@trezor/styles-common';
import { type NativeTheme } from '@trezor/theme';

export interface StylesProviderProps {
    children: ReactNode;
    direction?: Direction;
    renderer: IRenderer;
    theme: NativeTheme;
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
