import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme, useMediaQuery } from '@trezor/components';

import { App } from './App';
import { GlobalStyle } from './ui/GlobalStyle';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

const ThemedApp = () => {
    // The theme follows the system setting. There is no stored preference, like anything else.
    const variant = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';

    return (
        <ThemeProvider theme={{ variant, ...intermediaryTheme[variant] }}>
            <GlobalStyle />
            <App />
        </ThemeProvider>
    );
};

createRoot(root).render(
    <StrictMode>
        <ThemedApp />
    </StrictMode>,
);
