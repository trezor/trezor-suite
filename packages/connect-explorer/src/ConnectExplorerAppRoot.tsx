import { type ReactNode, useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { type ConnectExplorerReduxStore } from './store/createConnectExplorerReduxStore';

type ConnectExplorerAppRootProps = AppProps & { store: ConnectExplorerReduxStore };

type ThemeComponentProps = {
    store: ConnectExplorerReduxStore;
    children: ReactNode;
};

const ThemeComponent = ({ store, children }: ThemeComponentProps) => {
    const { resolvedTheme } = useTheme();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    useEffect(() => {
        setTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
    }, [resolvedTheme]);

    const router = useRouter();
    // Expose router to the global scope for tests.
    useEffect(() => {
        window.router = router;

        return () => {
            delete window.router;
        };
    }, [router]);

    return (
        <ThemeProvider theme={{ variant: theme, ...intermediaryTheme[theme] }}>
            <Provider store={store}>{children}</Provider>
        </ThemeProvider>
    );
};
export function ConnectExplorerAppRoot(props: ConnectExplorerAppRootProps) {
    const router = useRouter();

    return (
        <NextThemeProvider attribute="class" disableTransitionOnChange>
            <Head>
                <link rel="icon" type="image/png" href={router.basePath + '/images/favicon.png'} />
            </Head>
            <ThemeComponent store={props.store}>
                <props.Component {...props.pageProps} />
            </ThemeComponent>
        </NextThemeProvider>
    );
}
