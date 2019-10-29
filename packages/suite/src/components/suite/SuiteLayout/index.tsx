import React from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';

import { fetchLocale } from '@suite-actions/languageActions.useNative';
import Modals from '@suite-components/modals';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { Header as CommonHeader, LanguagePicker, colors } from '@trezor/components';

import ErrorBoundary from '@suite-support/ErrorBoundary';
import SuiteNotifications from '@suite-components/Notifications';
import Link from '@suite-components/Link';
import NoSSR from '@suite/support/suite/NoSSR';
import Head from 'next/head';
import { getRoute } from '@suite-utils/router';
import { URLS } from '@suite-constants';

import l10nMessages from './index.messages';
import { LANGUAGES } from '@suite-config';
import { AppState } from '@suite-types';
import { Header, Log } from '@suite-components';

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
    fetchLocale: typeof fetchLocale;
    toggleSidebar: () => void;
    isLanding?: boolean;
    showSuiteHeader?: boolean;
    fullscreenMode?: boolean;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    additionalDeviceMenuItems?: React.ReactNode;
    disableNotifications?: boolean;
    disableModals?: boolean;
    disableSidebar?: boolean;
}

const SuiteLayout = (props: Props & WrappedComponentProps) => (
    <PageWrapper isLanding={props.isLanding}>
        <Head>
            <title>{props.title ? `${props.title} | Trezor Suite` : 'Trezor Suite'}</title>
        </Head>
        <CommonHeader
            logoLinkComponent={<Link href={getRoute('wallet-index')} variant="nostyle" />}
            sidebarOpened={props.suite.showSidebar}
            toggleSidebar={props.toggleSidebar}
            togglerOpenText={<FormattedMessage {...l10nMessages.TR_MENU} />}
            togglerCloseText={<FormattedMessage {...l10nMessages.TR_MENU_CLOSE} />}
            sidebarEnabled={props.disableSidebar ? false : !props.isLanding}
            rightAddon={
                <NoSSR>
                    <LanguagePicker
                        language={props.suite.language}
                        languages={LANGUAGES}
                        onChange={option => {
                            props.fetchLocale(option.value);
                        }}
                    />
                </NoSSR>
            }
            links={[
                {
                    href: URLS.TREZOR_URL,
                    title: 'Trezor',
                },
                {
                    href: URLS.WIKI_URL,
                    title: props.intl.formatMessage(l10nMessages.TR_WIKI),
                },
                {
                    href: URLS.BLOG_URL,
                    title: props.intl.formatMessage(l10nMessages.TR_BLOG),
                },
                {
                    href: URLS.SUPPORT_URL,
                    title: props.intl.formatMessage(l10nMessages.TR_SUPPORT),
                },
            ]}
        />
        <ErrorBoundary>
            {!props.disableNotifications && <SuiteNotifications />}
            {!props.disableModals && <Modals />}
            <AppWrapper fullscreenMode={props.fullscreenMode} isLanding={props.isLanding}>
                <>
                    <Log />
                    {props.showSuiteHeader && (
                        <Header additionalDeviceMenuItems={props.additionalDeviceMenuItems} />
                    )}
                    {props.children}
                </>
            </AppWrapper>
        </ErrorBoundary>
        {!props.fullscreenMode ? props.footer : null}
    </PageWrapper>
);

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
});

export default injectIntl(
    connect(
        mapStateToProps,
        dispatch => ({
            fetchLocale: bindActionCreators(fetchLocale, dispatch),
            toggleSidebar: bindActionCreators(toggleSidebar, dispatch),
        }),
    )(SuiteLayout),
);
