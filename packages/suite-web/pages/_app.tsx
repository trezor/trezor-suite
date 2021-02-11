import React from 'react';
import App from 'next/app';
import dynamic from 'next/dynamic';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { initStore } from '@suite/reducers/store';
import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import Router from '@suite-support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';

import { isDev } from '@suite-utils/build';
import TrezorConnect from 'trezor-connect';
import { SENTRY_CONFIG } from '@suite-config';
import { Store } from '@suite-types';
import ImagesPreloader from '../support/ImagesPreloader';
import { CypressExportStore } from '../support/CypressExportStore';
import GlobalStyles from '@suite-support/styles/global';

const Tor = dynamic(() => import('@suite-support/Tor'), { ssr: false });

declare global {
    interface Window {
        store?: Store;
        Cypress?: any;
        TrezorConnect?: typeof TrezorConnect;
    }
}

interface Props {
    store: Store;
}

class TrezorSuiteApp extends App<Props> {
    componentDidMount() {
        if (!window.Cypress && !isDev()) {
            Sentry.init(SENTRY_CONFIG);
            Sentry.configureScope(scope => {
                scope.setTag('version', process.env.VERSION || 'undefined');
            });
        }
        if (window.Cypress) {
            // exposing ref to TrezorConnect allows us to mock its methods in cypress tests
            window.TrezorConnect = TrezorConnect;
        }
    }

    render() {
        const { Component, pageProps, store } = this.props;

        return (
            <>
                <ImagesPreloader />
                <CypressExportStore store={store} />
                <ReduxProvider store={store}>
                    <ThemeProvider>
                        <GlobalStyles />
                        <ErrorBoundary>
                            <Resize />
                            <Tor />
                            <OnlineStatus />
                            <IntlProvider>
                                <>
                                    {/*
                                just because we need make trezor-connect render the iframe
                            */}
                                    <div
                                        className="trezor-webusb-button"
                                        style={{
                                            width: '100%',
                                            position: 'absolute',
                                            top: '-1000px',
                                        }}
                                    />
                                    <Metadata />
                                    <Router />
                                    <ToastContainer />
                                    <Preloader>
                                        <Component {...pageProps} />
                                    </Preloader>
                                </>
                            </IntlProvider>
                        </ErrorBoundary>
                    </ThemeProvider>
                </ReduxProvider>
            </>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
