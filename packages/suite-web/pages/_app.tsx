import React from 'react';
import App, { AppContext } from 'next/app';
import { Provider as ReduxProvider } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { Button } from '@trezor/components';
import { initStore } from '@suite/reducers/store';
import { isStatic } from '@suite-utils/router';
import Preloader from '@suite-components/Preloader';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import CypressExportStore from '@suite-support/CypressExportStore';
import Router from '@suite-support/Router';
import l10nCommonMessages from '@suite-views/index.messages';
import { isDev } from '@suite-utils/build';
import { SENTRY } from '@suite-config';
import { Store } from '@suite-types';
import ImagesPreloader from '../support/ImagesPreloader';

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
    }

    render() {
        const { Component, pageProps, store, router } = this.props;
        const isStaticRoute = isStatic(router.pathname);

        return (
            <ErrorBoundary>
                <ImagesPreloader />
                <CypressExportStore store={store} />
                <ReduxProvider store={store}>
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
                                <FormattedMessage {...l10nCommonMessages.TR_CHECK_FOR_DEVICES} />
                            </Button>
                            <Router />
                            <Preloader isStatic={isStaticRoute}>
                                <Component {...pageProps} />
                            </Preloader>
                            <CypressExportStore store={store} />
                        </>
                    </IntlProvider>
                </ReduxProvider>
            </ErrorBoundary>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
