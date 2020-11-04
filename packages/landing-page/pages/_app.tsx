import React from 'react';
import NextApp from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'styled-components';
import { THEME } from '@trezor/components';

class App extends NextApp {
    render() {
        const { Component, pageProps } = this.props;
        return (
            <>
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <title>Trezor Suite</title>
                </Head>
                <ThemeProvider theme={THEME.light}>
                    <Component {...pageProps} />
                </ThemeProvider>
            </>
        );
    }
}

export default App;
