import React from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { fetchLocale } from '@suite-actions/languageActions.useNative';
import Modals from '@suite-components/modals/Container';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { Header as CommonHeader, LanguagePicker, colors } from '@trezor/components';
import Footer from '@suite-components/Footer';
import SuiteHeader from '@suite-components/SuiteHeader';
import suiteConfig from '@suite-config/index';
import Log from '@suite/components/suite/Log';
import Router from '@suite-support/Router';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import SuiteNotifications from '@suite-components/Notifications';
import { AppState } from '@suite-types/index';
import { TREZOR_URL, SUPPORT_URL, WIKI_URL, BLOG_URL } from '@suite/constants/urls';

import NoSSR from '@suite/support/suite/NoSSR';
import l10nMessages from './index.messages';

const PageWrapper = styled.div<Pick<Props, 'isLanding'>>`
    display: flex;
    flex: 1;
    flex-direction: column;
    background: ${props => (props.isLanding ? colors.LANDING : 'none')};
    align-items: center;
`;

const AppWrapper = styled.div<Pick<Props, 'isLanding' | 'fullscreenMode'>>`
    width: 100%;
    margin: 0 auto;

    ${props =>
        !props.fullscreenMode &&
        css`
            max-width: 1170px;
            margin-top: 30px;

            @media screen and (max-width: 1170px) {
                border-radius: 0px;
                margin-top: 0px;
            }
        `};

    flex: 1;
    background: ${props => (props.isLanding ? 'none' : colors.WHITE)};
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 4px 4px 0px 0px;
    height: 100%;
    overflow-y: hidden;
`;

interface Props {
    router: AppState['router'];
    suite: AppState['suite'];
    devices: AppState['devices'];
    fetchLocale: typeof fetchLocale;
    toggleSidebar: () => void;
    isLanding?: boolean;
    showSuiteHeader?: boolean;
    fullscreenMode?: boolean;
    children: React.ReactNode;
}

const Layout = (props: Props & InjectedIntlProps) => (
    <PageWrapper isLanding={props.isLanding}>
        <Router />
        <CommonHeader
            sidebarOpened={props.suite.showSidebar}
            toggleSidebar={props.toggleSidebar}
            togglerOpenText={<FormattedMessage {...l10nMessages.TR_MENU} />}
            togglerCloseText={<FormattedMessage {...l10nMessages.TR_MENU_CLOSE} />}
            sidebarEnabled={!props.isLanding}
            rightAddon={
                <NoSSR>
                    <LanguagePicker
                        language={props.suite.language}
                        languages={suiteConfig.languages}
                        onChange={option => {
                            props.fetchLocale(option.value);
                        }}
                    />
                </NoSSR>
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
        <ErrorBoundary>
            {
                props.router.app !== 'onboarding' && <SuiteNotifications />
            }
            <Modals />
            <AppWrapper fullscreenMode={props.fullscreenMode} isLanding={props.isLanding}>
                <>
                    <Log />
                    {props.showSuiteHeader && <SuiteHeader />}
                    {props.children}
                </>
            </AppWrapper>
        </ErrorBoundary>
        {!props.fullscreenMode && <Footer isLanding={props.isLanding} />}
    </PageWrapper>
);

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
    devices: state.devices,
});

export default injectIntl(
    connect(
        mapStateToProps,
        dispatch => ({
            fetchLocale: bindActionCreators(fetchLocale, dispatch),
            toggleSidebar: bindActionCreators(toggleSidebar, dispatch),
        }),
    )(Layout),
);
