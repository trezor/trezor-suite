import React from 'react';
import App, { AppContext } from 'next/app';
import { Store } from 'redux';
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
import l10nCommonMessages from '@suite-views/index.messages';
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
