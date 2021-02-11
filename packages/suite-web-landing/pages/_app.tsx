import React from 'react';
import NextApp from 'next/app';
import { ThemeProvider } from 'styled-components';
import { THEME } from '@trezor/components';

class App extends NextApp {
    render() {
        const { Component, pageProps } = this.props;
        return (
            <>
                <ThemeProvider theme={THEME.light}>
                    <Component {...pageProps} />
                </ThemeProvider>
            </>
        );
    }
}

export default App;
