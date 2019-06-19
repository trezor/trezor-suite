import React from 'react';
import App, { Container, NextAppContext } from 'next/app';

import { Store, bindActionCreators } from 'redux';
import { Provider as ReduxProvider, connect } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import { initStore } from '@suite/reducers/store';
import { SUITE } from '@suite-actions/constants';
import { State, Dispatch } from '@suite-types/index';
import Preloader from '@suite-components/Preloader';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import { Header as CommonHeader, LanguagePicker, colors } from '@trezor/components';
import { fetchLocale } from '@suite-actions/languageActions.useNative';
import { TREZOR_URL, SUPPORT_URL, WIKI_URL, BLOG_URL } from '@suite/constants/urls';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import suiteConfig from '@suite-config/index';
import l10nMessages from '@suite-components/Layout/index.messages';

interface Props {
    store: Store;
    loaded: State['suite']['loaded'];
    dispatch: Dispatch;
}

const Header = injectIntl(props => (
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

class TrezorSuiteApp extends App<Props> {
    static async getInitialProps({ Component, ctx }: NextAppContext): Promise<any> {
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
                <View style={styles.wrapper}>
                    <H1>Failed to load Trezor Suite</H1>
                    <P>Ups, something went wrong. Details: {error}</P>
                </View>
            );
        }
    }

    render() {
        const { Component, pageProps, store, language, dispatch } = this.props;

        return (
            <Container>
                <ReduxProvider store={store}>
                    <IntlProvider>
                        <>
                            <Header language={language} dispatch={dispatch} />
                            <Component {...pageProps} />
                        </>
                    </IntlProvider>
                </ReduxProvider>
            </Container>
        );
    }
}

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
    language: state.suite.language,
});

export default withRedux(initStore)(
    connect(
        mapStateToProps,
        // dispatch => ({
        //     fetchLocale: bindActionCreators(fetchLocale, dispatch),
        // }),
    )(TrezorSuiteApp),
);
