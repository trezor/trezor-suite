import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { colors } from '@trezor/components';
import WalletMenuItems from '@suite-components/DeviceMenu/components/MenuItems';

import { fetchLocale } from '@suite-actions/languageActions.useNative';
import Modals from '@suite-components/modals';
import { toggleSidebar } from '@suite-actions/suiteActions';

import ErrorBoundary from '@suite-support/ErrorBoundary';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu/Container';
import { AppState } from '@suite-types';
import { Log } from '@suite-components';
import DeviceMenu from '@suite-components/DeviceMenu';

const PageWrapper = styled.div<Pick<Props, 'isLanding'>>`
    display: flex;
    flex: 1;
`;

const AppWrapper = styled.div<Pick<Props, 'isLanding' | 'fullscreenMode'>>`
    display: flex;
    flex: 1;
    background: ${props => (props.isLanding ? 'none' : colors.WHITE)};

    flex-direction: column;
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
                    <DeviceMenu additionalDeviceMenuItems={<WalletMenuItems />} />
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
