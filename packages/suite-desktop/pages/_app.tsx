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
import Tor from '@suite-support/Tor';
import OnlineStatus from '@suite-support/OnlineStatus';
import BridgeStatus from '@desktop/support/BridgeStatus';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import DesktopUpdater from '@desktop/support/DesktopUpdater';
import { SENTRY_CONFIG } from '@suite-config';
import Resize from '@suite-support/Resize';
import { isDev } from '@suite-utils/build';
import DesktopTitlebarWrapper from '@desktop/support/DesktopTitlebar';

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
        window.desktopApi!.clientReady();
    }

    render() {
        const { Component, pageProps, store } = this.props;

        return (
            <DesktopTitlebarWrapper>
                <ReduxProvider store={store}>
                    <ErrorBoundary>
                        <Resize />
                        <Tor />
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
            </DesktopTitlebarWrapper>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
