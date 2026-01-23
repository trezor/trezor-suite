import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { App } from './App';
const root = document.getElementById('root');
if (!root) throw new Error('Missing root');

createRoot(root).render(
    <ThemeProvider theme={intermediaryTheme['dark']}>
        <App />
    </ThemeProvider>,
);
