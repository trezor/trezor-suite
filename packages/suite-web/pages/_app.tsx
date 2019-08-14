import React from 'react';
import App, { Container, AppContext } from 'next/app';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { Button } from '@trezor/components';
import { initStore } from '@suite/reducers/store';
import { isStatic } from '@suite-utils/router';
import Preloader from '@suite-components/Preloader';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import config from '@suite-config/index';

Sentry.init({ dsn: config.sentry });
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
                <div id="web-usb-hideout" style={{ position: 'absolute' }}>
                    <Button isInverse icon="PLUS" additionalClassName="trezor-webusb-button" style={{ width: '100%' }}>
                        Check for devices
                    </Button>
                </div>

                <Container>
                    <ReduxProvider store={store}>
                        <IntlProvider>
                            <Preloader isStatic={isStaticRoute}>
                                <Component {...pageProps} />
                            </Preloader>
                        </IntlProvider>
                    </ReduxProvider>
                </Container>
            </ErrorBoundary>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
