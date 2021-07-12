import React from 'react';
import App from 'next/app';
import dynamic from 'next/dynamic';
import { Store } from 'redux';
import { Provider as ReduxProvider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import * as Sentry from '@sentry/browser';
import { initStore } from '@suite/reducers/store';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import Router from '@suite-support/Router';
import OnlineStatus from '@suite-support/OnlineStatus';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import DesktopUpdater from '@desktop/support/DesktopUpdater';
import { SENTRY_CONFIG } from '@suite-config';
import Resize from '@suite-support/Resize';
import ThemeProvider from '@suite-support/ThemeProvider';
import GlobalStyleProvider from '@suite-support/styles/GlobalStyleProvider';
import { isDev } from '@suite-utils/build';
import DesktopTitlebarWrapper from '@desktop/support/DesktopTitlebar';

const Tor = dynamic(() => import('@suite-support/Tor'), { ssr: false });

interface Props {
    store: Store;
}

class TrezorSuiteApp extends App<Props> {
    state = {
        isUpdateVisible: false,
    };

    componentDidMount() {
        if (!isDev()) {
            Sentry.init(SENTRY_CONFIG);
            Sentry.configureScope(scope => {
                scope.setTag('version', process.env.VERSION || 'undefined');
            });
        }
        window.desktopApi!.clientReady();
    }

    setIsUpdateVisible = (isUpdateVisible: boolean) => {
        this.setState({ isUpdateVisible });
    };

    render() {
        const { Component, pageProps, store } = this.props;

        return (
            <ReduxProvider store={store}>
                <ThemeProvider>
                    <GlobalStyleProvider />
                    <DesktopTitlebarWrapper>
                        <ErrorBoundary>
                            <Resize />
                            <Tor />
                            <OnlineStatus />
                            <IntlProvider>
                                <DesktopUpdater setIsUpdateVisible={this.setIsUpdateVisible} />
                                <Router />
                                <ToastContainer />
                                <Preloader hideModals={this.state.isUpdateVisible}>
                                    <Component {...pageProps} />
                                </Preloader>
                            </IntlProvider>
                        </ErrorBoundary>
                    </DesktopTitlebarWrapper>
                </ThemeProvider>
            </ReduxProvider>
        );
    }
}

export default withRedux(initStore)(TrezorSuiteApp);
