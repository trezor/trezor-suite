import React from 'react';
import styled from 'styled-components';
// import { injectIntl, WrappedComponentProps } from 'react-intl';
import { colors } from '@trezor/components';

import Modals from '@suite-components/modals';

import ErrorBoundary from '@suite-support/ErrorBoundary';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu/Container';
// import { AppState } from '@suite-types';
import { Log } from '@suite-components';
import MenuSecondary from '@suite/components/suite/MenuSecondary';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
`;

const AppWrapper = styled.div<Pick<Props, 'isLanding'>>`
    display: flex;
    flex: 1;
    background: ${props => (props.isLanding ? 'none' : colors.WHITE)};
    flex-direction: column;
`;

interface Props {
    // router: AppState['router'];
    // suite: AppState['suite'];
    children?: React.ReactNode;
    fullscreenMode?: boolean;
    title?: string;
    footer?: React.ReactNode;
    disableNotifications?: boolean;
    disableModals?: boolean;
    secondaryMenu?: React.ReactNode;
    isLanding?: boolean;
}

const SuiteLayout = (props: Props) => (
    <PageWrapper>
        <Head>
            <title>{props.title ? `${props.title} | Trezor Suite` : 'Trezor Suite'}</title>
        </Head>
        <Menu />
        <ErrorBoundary>
            {!props.disableModals && <Modals />}
            {props.secondaryMenu && <MenuSecondary>{props.secondaryMenu}</MenuSecondary>}
            <AppWrapper isLanding={props.isLanding}>
                <>
                    {!props.disableNotifications && <SuiteNotifications />}
                    <Log />
                    {props.children}
                </>
            </AppWrapper>
        </ErrorBoundary>
        {!props.fullscreenMode ? props.footer : null}
    </PageWrapper>
);

// const mapStateToProps = (state: AppState) => ({
//     router: state.router,
//     suite: state.suite,
// });

// export default injectIntl(SuiteLayout);
export default SuiteLayout;