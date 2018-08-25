/* @flow */

import * as React from 'react';
import colors from 'config/colors';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import Header from 'components/Header';
import Footer from 'components/Footer';
import ModalContainer from 'components/modal';
import Notifications from 'components/Notification';
import Log from 'components/Log';
import DeviceSettingsTabs from './views/DeviceSettingsTabs';

import LeftNavigation from './components/LeftNavigation/Container';
import AccountTabs from './components/Tabs';

type WalletContainerProps = {
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

type ContentProps = {
    children?: React.Node
}

const AppWrapper = styled.div`
    position: relative;
    min-height: 100vh;
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
    overflow: hidden;
    margin-top: 32px;

    @media screen and (max-width: 1170px) {
        border-radius: 0px;
        margin-top: 0px;
    }
`;

const Wallet = (props: WalletContainerProps) => (
    <AppWrapper>
        <Header />
        <WalletWrapper>
            <LeftNavigation />
            <article>
                <nav>
                    <Route path="/device/:device/network/:network/account/:account" component={AccountTabs} />
                    <Route path="/device/:device/device-settings" component={DeviceSettingsTabs} />
                </nav>
                <Notifications />
                <Log />
                { props.children }
                <Footer />
            </article>
        </WalletWrapper>
        <ModalContainer />
    </AppWrapper>
);

const mapStateToProps: MapStateToProps<State, {}, WalletContainerProps> = (state: State, own: {}): WalletContainerProps => ({
    wallet: state.wallet,
});

export default withRouter(
    connect(mapStateToProps, null)(Wallet),
);
