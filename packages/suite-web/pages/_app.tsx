import React from 'react';
import App, { Container, NextAppContext } from 'next/app';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';

import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBounday from '@suite-support/ErrorBoundary';
import config from '@suite-config/index';

Sentry.init({ dsn: config.sentry });
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
            <ErrorBounday>
                <Container>
                    <ReduxProvider store={store}>
                        <IntlProvider>
                            <Preloader>
                                <Component {...pageProps} />
                            </Preloader>
                        </IntlProvider>
                    </ReduxProvider>
                </Container>
            </ErrorBounday>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
