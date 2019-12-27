import React from 'react';
import App, { AppContext } from 'next/app';
import { Provider as ReduxProvider } from 'react-redux';
import { Translation } from '@suite-components/Translation';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { Button } from '@trezor/components';
import { initStore } from '@suite/reducers/store';
import { isStatic } from '@suite-utils/router';
import Preloader from '@suite-components/Preloader';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize/Container';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import CypressExportStore from '@suite-support/CypressExportStore';
import Router from '@suite-support/Router';
import messages from '@suite/support/messages';
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
            Sentry.init({ dsn: SENTRY });
        }
        if (window.Cypress) {
            // exposing ref to TrezorConnect allows us to mock its methods in cypress tests
            window.TrezorConnect = TrezorConnect;
        }
    }

    render() {
        const { Component, pageProps, store, router } = this.props;
        // const isModal = (store.getState().router && store.getState().router.route) ? store.getState.router.route.isModal : false;

        const isModal = true;
        console.log('router', router);
        console.log('isModal0', isModal);

        return (
            <ErrorBoundary>
                <ImagesPreloader />
                <CypressExportStore store={store} />
                <ReduxProvider store={store}>
                    <Resize />
                    <IntlProvider>
                        <>
                            {/*
                                initially rendered webusb button, only for web. whether displayed or not 
                                is handled by suite/components/Webusb component
                            */}
                            <Button
                                isInverse
                                icon="PLUS"
                                additionalClassName="trezor-webusb-button"
                                style={{ width: '100%', position: 'absolute', top: '-1000px' }}
                            >
                                <Translation {...messages.TR_CHECK_FOR_DEVICES} />
                            </Button>
                            <Router />
                            <Preloader isModal={isModal}>
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
