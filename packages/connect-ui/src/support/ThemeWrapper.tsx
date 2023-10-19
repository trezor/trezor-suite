import { ReactNode } from 'react';

import { ThemeProvider } from 'styled-components';

import { THEME } from '@trezor/components';

interface ReactWrapperProps {
    children: ReactNode;
}

export const ThemeWrapper = ({ children }: ReactWrapperProps) => (
    <ThemeProvider theme={THEME.light}>{children}</ThemeProvider>
);
