import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider } from 'styled-components';
import type { AppProps } from 'next/app';
import { useTheme } from 'next-themes';

import { intermediaryTheme } from '@trezor/components';

import '../styles/globals.css';
import '@trezor/connect-explorer-theme/style.css';
import { store } from '../store';
import StyledComponentsRegistry from '../components/util/StyledComponentsRegistry';

const ThemeComponent = ({ Component, pageProps }: AppProps) => {
    const { resolvedTheme } = useTheme();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    useEffect(() => {
        setTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
    }, [resolvedTheme]);

    return (
        <ThemeProvider theme={intermediaryTheme[theme]}>
            <StyledComponentsRegistry>
                <Provider store={store}>
                    <Component {...pageProps} />
                </Provider>
            </StyledComponentsRegistry>
        </ThemeProvider>
    );
};
export default function MyApp(props: AppProps) {
    return (
        <NextThemeProvider attribute="class" disableTransitionOnChange>
            <ThemeComponent {...props} />
        </NextThemeProvider>
    );
}
