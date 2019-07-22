import React from 'react';
import App, { Container, AppContext } from 'next/app';
import { Store } from 'redux';
import { Provider as ReduxProvider, connect } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import { initStore } from '@suite/reducers/store';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types/index';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import { Header as CommonHeader, LanguagePicker, P, H1 } from '@trezor/components';
import { fetchLocale } from '@suite-actions/languageActions.useNative';
import { TREZOR_URL, SUPPORT_URL, WIKI_URL, BLOG_URL } from '@suite/constants/urls';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import suiteConfig from '@suite-config/index';
import l10nMessages from '@suite-components/Layout/index.messages';

interface HeaderProps extends InjectedIntlProps {
    dispatch: Dispatch;
    language: AppState['suite']['language'];
}

const Header = injectIntl((props: HeaderProps) => (
    <CommonHeader
        sidebarEnabled={false}
        rightAddon={
            <LanguagePicker
                language={props.language}
                languages={suiteConfig.languages}
                onChange={option => {
                    props.dispatch(fetchLocale(option.value));
                }}
            />
        }
        links={[
            {
                href: TREZOR_URL,
                title: 'Trezor',
            },
            {
                href: WIKI_URL,
                title: props.intl.formatMessage(l10nMessages.TR_WIKI),
            },
            {
                href: BLOG_URL,
                title: props.intl.formatMessage(l10nMessages.TR_BLOG),
            },
            {
                href: SUPPORT_URL,
                title: props.intl.formatMessage(l10nMessages.TR_SUPPORT),
            },
        ]}
    />
));

interface Props {
    store: Store;
    loaded: AppState['suite']['loaded'];
    language: AppState['suite']['language'];
    error: AppState['suite']['error'];
    dispatch: Dispatch;
}
class TrezorSuiteApp extends App<Props> {
    static async getInitialProps({ Component, ctx }: AppContext): Promise<any> {
        return {
            pageProps: Component.getInitialProps ? await Component.getInitialProps(ctx) : {},
        };
    }

    componentDidMount() {
        const { loaded, error, dispatch } = this.props;

        if (!loaded) {
            dispatch({ type: SUITE.INIT });
        }
        if (error) {
            return (
                <div>
                    <H1>Failed to load Trezor Suite</H1>
                    <P>Ups, something went wrong. Details: {error}</P>
                </div>
            );
        }
    }

    render() {
        const { Component, pageProps, store, language, dispatch } = this.props;

        return (
            <Container>
                <ReduxProvider store={store}>
                    <IntlProvider>
                        <div style={{ height: 'auto', maxWidth: '100vw', overflowX: 'hidden' }}>
                            <Header language={language} dispatch={dispatch} />
                            <Component {...pageProps} />
                        </div>
                    </IntlProvider>
                </ReduxProvider>
            </Container>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
    language: state.suite.language,
});

export default withRedux(initStore)(connect(mapStateToProps)(TrezorSuiteApp));
