import React from 'react';
import App, { AppContext } from 'next/app';
import { Store } from 'redux';
import { isStatic } from '@suite-utils/router';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';

import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import Router from '@suite-support/Router';
import BridgeStatus from '@desktop/support/BridgeStatus';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import { SENTRY } from '@suite-config';

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
        const { Component, pageProps, store, router } = this.props;
        const isStaticRoute = isStatic(router.pathname);

        return (
            <ErrorBoundary>
                <ReduxProvider store={store}>
                    <IntlProvider>
                        <>
                            <Router />
                            <BridgeStatus />
                            <Preloader isStatic={isStaticRoute}>
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
