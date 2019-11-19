import React from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { colors } from '@trezor/components';

import { fetchLocale } from '@suite-actions/languageActions.useNative';
import Modals from '@suite-components/modals';
import { toggleSidebar } from '@suite-actions/suiteActions';

import ErrorBoundary from '@suite-support/ErrorBoundary';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu';
import { AppState } from '@suite-types';
import { Header, Log } from '@suite-components';

const PageWrapper = styled.div<Pick<Props, 'isLanding'>>`
    display: flex;
    flex: 1;
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
        <Menu />
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
