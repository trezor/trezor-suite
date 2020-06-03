import React from 'react';
import App, { AppContext } from 'next/app';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import { ToastContainer } from 'react-toastify';
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
    static async getInitialProps({ Component, ctx }: AppContext): Promise<any> {
        return {
            pageProps: Component.getInitialProps ? await Component.getInitialProps(ctx) : {},
        };
    }

    componentDidMount() {
        if (!isDev()) Sentry.init(SENTRY_CONFIG);
    }

    render() {
        const { Component, pageProps, store } = this.props;

        return (
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
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
