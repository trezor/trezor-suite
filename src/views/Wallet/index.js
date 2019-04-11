/* @flow */

import * as React from 'react';
import { colors } from 'trezor-ui-components';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';
import { getPattern } from 'support/routes';

import type { State, Dispatch } from 'flowtype';

import * as WalletActions from 'actions/WalletActions';
import { bindActionCreators } from 'redux';

import Header from 'components/Header';
import Footer from 'components/Footer';
import ModalContainer from 'components/modals/Container';
import AppNotifications from 'components/notifications/App';
import ContextNotifications from 'components/notifications/Context';

import { SCREEN_SIZE } from 'config/variables';

import Log from 'components/Log';

import LeftNavigation from './components/LeftNavigation/Container';
import TopNavigationAccount from './components/TopNavigationAccount';
import TopNavigationDeviceSettings from './components/TopNavigationDeviceSettings';
import TopNavigationWalletSettings from './components/TopNavigationWalletSettings';

type StateProps = {|
    wallet: $ElementType<State, 'wallet'>,
|};

type DispatchProps = {|
    toggleSidebar: typeof WalletActions.toggleSidebar,
|};

type OwnProps = {|
    children?: React.Node,
|};

export type Props = {| ...StateProps, ...DispatchProps, ...OwnProps |};

const AppWrapper = styled.div`
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: ${colors.BACKGROUND};

    &.resized {
        min-height: 680px;
    }
`;

const WalletWrapper = styled.div`
    width: 100%;
    max-width: 1170px;
    margin: 0 auto;
    flex: 1;
    background: ${colors.WHITE};
    display: flex;
    flex-direction: row;
    border-radius: 4px 4px 0px 0px;
    margin-top: 32px;

    @media screen and (max-width: 1170px) {
        border-radius: 0px;
        margin-top: 0px;
    }
`;

const MainContent = styled.article`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    border-top-right-radius: 4px;
    border-top-left-radius: 4px;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        ${props =>
            props.preventBgScroll &&
            css`
                position: fixed;
                width: 100%;
                min-height: calc(100vh - 52px);
            `}
    }

    @media screen and (max-width: 1170px) {
        border-top-right-radius: 0px;
        border-top-left-radius: 0px;
    }
`;

const Navigation = styled.nav`
    height: 70px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    background: ${colors.WHITE};
    position: relative;
`;

const Body = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Wallet = (props: Props) => (
    <AppWrapper lang={props.wallet.language}>
        <Header
            sidebarEnabled={!!props.wallet.selectedDevice}
            sidebarOpened={props.wallet.showSidebar}
            toggleSidebar={props.toggleSidebar}
        />
        <AppNotifications />
        <WalletWrapper>
            {props.wallet.selectedDevice && <LeftNavigation />}
            <MainContent preventBgScroll={props.wallet.showSidebar}>
                <Navigation>
                    <Route
                        path={getPattern('wallet-account-summary')}
                        component={TopNavigationAccount}
                    />
                    <Route
                        path={getPattern('wallet-device-settings')}
                        component={TopNavigationDeviceSettings}
                    />
                    <Route
                        path={getPattern('wallet-settings')}
                        component={TopNavigationWalletSettings}
                    />
                </Navigation>
                <ContextNotifications />
                <Log />
                <Body>{props.children}</Body>
                <Footer isLanding={false} />
            </MainContent>
        </WalletWrapper>
        <ModalContainer />
    </AppWrapper>
);

const mapStateToProps = (state: State): StateProps => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    toggleSidebar: bindActionCreators(WalletActions.toggleSidebar, dispatch),
});

export default withRouter<Props>(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(Wallet)
);
