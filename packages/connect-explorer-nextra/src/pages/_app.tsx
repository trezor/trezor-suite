import React from 'react';
import { Provider } from 'react-redux';

import { ThemeProvider } from 'styled-components';
import type { AppProps } from 'next/app';

import { intermediaryTheme } from '@trezor/components';

import '../styles/globals.css';
import '@trezor/connect-explorer-theme/style.css';
import { store } from '../store';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider theme={intermediaryTheme.light}>
            <Provider store={store}>
                <Component {...pageProps} />
            </Provider>
        </ThemeProvider>
    );
}
