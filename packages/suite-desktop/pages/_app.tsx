import React from 'react';
import App, { AppContext } from 'next/app';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';

import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import Router from '@suite-support/Router';
import OnlineStatus from '@suite-support/OnlineStatus';
import BridgeStatus from '@desktop/support/BridgeStatus';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import { SENTRY } from '@suite-config';
import Resize from '@suite-support/Resize/Container';

Sentry.init({ dsn: SENTRY });

interface Props {
    store: Store;
}

class TrezorSuiteApp extends App<Props> {
    static async getInitialProps({ Component, ctx }: AppContext): Promise<any> {
        return {
            pageProps: Component.getInitialProps ? await Component.getInitialProps(ctx) : {},
        };
    }

    render() {
        const { Component, pageProps, store } = this.props;

        return (
            <ErrorBoundary>
                <ReduxProvider store={store}>
                    <Resize />
                    <OnlineStatus />
                    <IntlProvider>
                        <>
                            <Router />
                            <BridgeStatus />
                            <Preloader>
                                <Component {...pageProps} />
                            </Preloader>
                        </>
                    </IntlProvider>
                </ReduxProvider>
            </ErrorBoundary>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
