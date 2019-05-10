import React from 'react';
import App, { Container, NextAppContext } from 'next/app';

import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';

import { lightTheme } from '@trezor/components/themes/lightTheme';
import { ThemeContext } from '@suite/hooks/useTheme';
import { initStore } from '@suite/reducers/store';
import TrezorConnect from '@suite/TrezorConnect';
import RouterHandler from '@suite/RouterHandler';

interface Props {
    store: Store;
}

class TrezorSuiteApp extends App<Props> {
    static async getInitialProps({ Component, ctx }: NextAppContext): Promise<any> {
        return {
            pageProps: Component.getInitialProps ? await Component.getInitialProps(ctx) : {},
        };
    }

    render() {
        const { Component, pageProps, store } = this.props;
        return (
            <Container>
                <ReduxProvider store={store}>
                    <RouterHandler store={store} />
                    <TrezorConnect />
                    <ThemeContext.Provider value={lightTheme}>
                        <Component {...pageProps} />
                    </ThemeContext.Provider>
                </ReduxProvider>
            </Container>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
