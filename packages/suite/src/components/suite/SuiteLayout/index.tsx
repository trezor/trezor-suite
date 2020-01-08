import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { colors } from '@trezor/components';
import Modals from '@suite-components/modals';
import ErrorBoundary from '@suite-support/ErrorBoundary';
// import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu/Container';
import { AppState } from '@suite-types';
import { Log } from '@suite-components';
import MenuSecondary from '@suite-components/MenuSecondary';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 600px;
    height: 100vh;
    overflow-x: hidden;
`;

const AppWrapper = styled.div<Pick<Props, 'isLanding'>>`
    display: flex;
    background: ${props => (props.isLanding ? 'none' : colors.WHITE)};
    flex-direction: column;
    overflow: auto;
    height: 100vh;
    flex: 1 1 0%;
`;

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children?: React.ReactNode;
    fullscreenMode?: boolean;
    title?: string;
    footer?: React.ReactNode;
    disableNotifications?: boolean;
    disableModals?: boolean;
    secondaryMenu?: React.ReactNode;
    isLanding?: boolean;
};

const SuiteLayout = (props: Props) => {
    return (
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
                        {/* notifications disabled now. lets redo them into new design */}
                        {/* {!props.disableNotifications && <SuiteNotifications />} */}
                        <Log />
                        {props.children}
                    </>
                </AppWrapper>
            </ErrorBoundary>
            {!props.fullscreenMode ? props.footer : null}
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
