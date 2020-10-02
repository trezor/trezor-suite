import React from 'react';
import App from 'next/app';
import Head from 'next/head';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import Router from '@suite-support/Router';
import OnlineStatus from '@suite-support/OnlineStatus';
import BridgeStatus from '@desktop/support/BridgeStatus';
import VersionCheck from '@desktop/support/VersionCheck';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import { SENTRY_CONFIG } from '@suite-config';
import Resize from '@suite-support/Resize/Container';
import { isDev } from '@suite-utils/build';

interface Props {
    store: Store;
}

class TrezorSuiteApp extends App<Props> {
    componentDidMount() {
        if (!isDev()) {
            Sentry.init(SENTRY_CONFIG);
            Sentry.configureScope(scope => {
                scope.setTag('version', process.env.VERSION || 'undefined');
            });
        }
    }

    render() {
        const { Component, pageProps, store } = this.props;

        return (
            <>
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <ReduxProvider store={store}>
                    <ErrorBoundary>
                        <Resize />
                        <OnlineStatus />
                        <IntlProvider>
                            <Router />
                            <BridgeStatus />
                            <ToastContainer />
                            <VersionCheck>
                                <Preloader>
                                    <Component {...pageProps} />
                                </Preloader>
                            </VersionCheck>
                        </IntlProvider>
                    </ErrorBoundary>
                </ReduxProvider>
            </>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
