import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';
import SmallLayout from './components/SmallLayout';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import { Props } from './Container';
import Menu from '@suite-components/Menu/Container';
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

const MaxWithWrapper = styled.div<{ withMenu: boolean }>`
    max-width: 1024px;
    max-width: ${props => (props.withMenu ? '786px' : '1024px')};
`;

export default (props: Props) => {
    if (props.layoutSize === 'UNAVAILABLE') return <SmallLayout />;
    const showBigMenus = ['MEGA', 'LARGE', 'NORMAL'].includes(props.layoutSize);

    return (
        <PageWrapper>
            <Head>
                <title>{props.title ? `${props.title} | Trezor Suite` : 'Trezor Suite'}</title>
            </Head>
            {showBigMenus && <Menu />}
            <Body>
                <DiscoveryProgress />
                <SuiteNotifications />
                <Columns>
                    {props.secondaryMenu && showBigMenus && (
                        <MenuSecondary>{props.secondaryMenu}</MenuSecondary>
                    )}
                    <AppWrapper>
                        <MaxWithWrapper withMenu={!!props.secondaryMenu}>
                            {props.children}
                        </MaxWithWrapper>
                    </AppWrapper>
                </Columns>
            </Body>
        </PageWrapper>
    );
};
