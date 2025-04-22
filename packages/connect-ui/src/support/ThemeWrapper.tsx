import { ReactNode } from 'react';

import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

interface ReactWrapperProps {
    children: ReactNode;
}

export const ThemeWrapper = ({ children }: ReactWrapperProps) => (
    <ThemeProvider theme={{ variant: 'light', ...intermediaryTheme.light }}>
        {children}
    </ThemeProvider>
);
