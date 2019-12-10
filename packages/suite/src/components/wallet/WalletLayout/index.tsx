import React from 'react';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import { variables } from '@trezor/components';
import WalletNotifications from '@wallet-components/Notifications';
import Content from '@wallet-components/Content';
import MenuSecondary from '@suite/components/suite/MenuSecondary';
import ProgressBar from './components/ProgressBar';
import { AppState } from '@suite-types';
import { SuiteLayout } from '@suite-components';
import Menu from '@wallet-components/Menu';

const { SCREEN_SIZE } = variables;

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
    wallet: state.wallet,
});

type Props = {
    topNavigationComponent?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
} & ReturnType<typeof mapStateToProps>;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex: 1;
    flex-direction: row;
`;

const ContentWrapper = styled.div<{ preventBgScroll?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        ${props =>
            props.preventBgScroll &&
            css`
                position: fixed;
                width: 100%;
                min-height: calc(100vh - 52px);
            `}
    }
`;

const WalletLayout = (props: Props) => {
    return (
        <SuiteLayout showSuiteHeader title={props.title}>
            <Wrapper data-test="@wallet/layout">
                <ProgressBar />
                <MenuSecondary isOpen={props.suite.showSidebar}>
                    <Menu />
                </MenuSecondary>
                <ContentWrapper preventBgScroll={props.suite.showSidebar}>
                    <WalletNotifications />
                    <Content>{props.children}</Content>
                </ContentWrapper>
            </Wrapper>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps)(WalletLayout);
