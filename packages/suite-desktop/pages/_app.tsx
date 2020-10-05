import React from 'react';
import App from 'next/app';
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
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import DesktopUpdater from '@desktop/support/DesktopUpdater';
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
                <ReduxProvider store={store}>
                    <ErrorBoundary>
                        <Resize />
                        <OnlineStatus />
                        <IntlProvider>
                            <DesktopUpdater />
                            <Router />
                            <BridgeStatus />
                            <ToastContainer />
                            <Preloader>
                                <Component {...pageProps} />
                            </Preloader>
                        </IntlProvider>
                    </ErrorBoundary>
                </ReduxProvider>
            </>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
