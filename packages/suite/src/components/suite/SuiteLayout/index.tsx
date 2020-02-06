import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { colors } from '@trezor/components-v2';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu/Container';
import { AppState } from '@suite-types';
import MenuSecondary from '@suite-components/MenuSecondary';
import { DiscoveryProgress } from '@wallet-components';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 600px;
    height: 100vh;
    overflow-x: hidden;
`;

const Body = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;
    height: 100vh;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
const Columns = styled.div`
    display: flex;
    flex-direction: row;
    overflow: hidden;
    height: 100%;
`;

const AppWrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    flex-direction: column;
    overflow: auto;
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

            <Body>
                <DiscoveryProgress />
                <SuiteNotifications />
                <Columns>
                    {props.secondaryMenu && <MenuSecondary>{props.secondaryMenu}</MenuSecondary>}
                    <AppWrapper>{props.children}</AppWrapper>
                </Columns>
            </Body>
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
