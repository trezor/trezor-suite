import React from 'react';
import App, { AppContext } from 'next/app';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { CaptureConsole } from '@sentry/integrations';
import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import { ToastContainer } from 'react-toastify';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize/Container';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import CypressExportStore from '@suite-support/CypressExportStore';
import Router from '@suite-support/Router';

import { isDev } from '@suite-utils/build';
import TrezorConnect from 'trezor-connect';
import { SENTRY } from '@suite-config';
import { Store } from '@suite-types';
import ImagesPreloader from '../support/ImagesPreloader';

declare global {
    interface Window {
        store: Store;
        Cypress: any;
        TrezorConnect: typeof TrezorConnect;
    }
}

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
        if (!window.Cypress && !isDev()) {
            Sentry.init({
                dsn: SENTRY,
                integrations: [
                    new CaptureConsole({
                        levels: ['error'],
                    }),
                ],
                release: process.env.COMMITHASH,
                environment: process.env.SUITE_TYPE,
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
            <ErrorBoundary>
                <ImagesPreloader />
                <CypressExportStore store={store} />
                <ReduxProvider store={store}>
                    <Resize />
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
                            <Router />
                            <ToastContainer />
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
