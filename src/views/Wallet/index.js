/* @flow */

import * as React from 'react';
import colors from 'config/colors';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import type { MapStateToProps } from 'react-redux';
import type { State } from 'flowtype';

import Header from 'components/Header';
import Footer from 'components/Footer';
import ModalContainer from 'components/modals/Container';
import AppNotifications from 'components/notifications/App';
import ContextNotifications from 'components/notifications/Context';

import Log from 'components/Log';

import LeftNavigation from './components/LeftNavigation/Container';
import TopNavigationAccount from './components/TopNavigationAccount';
import TopNavigationDeviceSettings from './components/TopNavigationDeviceSettings';


type WalletContainerProps = {
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

// type ContentProps = {
//     children?: React.Node
// }

const AppWrapper = styled.div`
    position: relative;
    min-height: 100%;
    min-width: 720px;
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
    
    @media screen and (max-width: 1170px) {
        border-top-right-radius: 0px;
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

const Wallet = (props: WalletContainerProps) => (
    <AppWrapper>
        <Header />
        <AppNotifications />
        <WalletWrapper>
            {props.wallet.selectedDevice && <LeftNavigation />}
            <MainContent>
                <Navigation>
                    <Route path="/device/:device/network/:network/account/:account" component={TopNavigationAccount} />
                    <Route path="/device/:device/device-settings" component={TopNavigationDeviceSettings} />
                </Navigation>
                <ContextNotifications />
                <Log />
                <Body>
                    { props.children }
                </Body>
                <Footer />
            </MainContent>
        </WalletWrapper>
        <ModalContainer />
    </AppWrapper>
);

const mapStateToProps: MapStateToProps<State, {}, WalletContainerProps> = (state: State): WalletContainerProps => ({
    wallet: state.wallet,
});

export default withRouter(
    connect(mapStateToProps, null)(Wallet),
);
