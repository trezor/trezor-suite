import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider } from 'styled-components';
import type { AppProps } from 'next/app';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useRouter } from 'next/router';

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

    const router = useRouter();
    // Expose router to the global scope for tests
    useEffect(() => {
        window.router = router;

        return () => {
            delete window.router;
        };
    }, [router]);

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
            <Head>
                <link rel="icon" type="image/png" href="favicon.png" />
            </Head>
            <ThemeComponent {...props} />
        </NextThemeProvider>
    );
}
