import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { App } from './App';
import { ThemeContextProvider, useTheme } from './contexts/ThemeContext';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');

const ThemedApp = () => {
    const { resolvedTheme } = useTheme();
    const theme = {
        variant: resolvedTheme,
        ...intermediaryTheme[resolvedTheme],
    };

    return (
        <ThemeProvider theme={theme}>
            <App theme={theme} />
        </ThemeProvider>
    );
};

createRoot(root).render(
    <ThemeContextProvider>
        <ThemedApp />
    </ThemeContextProvider>,
);
