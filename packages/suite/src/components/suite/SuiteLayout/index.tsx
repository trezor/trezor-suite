import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { colors } from '@trezor/components';
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

const AppWrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    flex-direction: column;
    overflow: auto;
    height: 100vh;
    flex: 1 1 0%;
`;

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    layoutSize: state.resize.size,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children?: React.ReactNode;
    title?: string;
    secondaryMenu?: React.ReactNode;
};

const SuiteLayout = (props: Props) => {
    return (
        <PageWrapper>
            <Head>
                <title>{props.title ? `${props.title} | Trezor Suite` : 'Trezor Suite'}</title>
            </Head>
            {props.layoutSize !== 'small' && <Menu />}
            {props.secondaryMenu && <MenuSecondary>{props.secondaryMenu}</MenuSecondary>}
            <AppWrapper>
                <>
                    {/* notifications disabled now. lets redo them into new design */}
                    {/* {!props.disableNotifications && <SuiteNotifications />} */}
                    <Log />
                    {props.children}
                </>
            </AppWrapper>
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
