/* @flow */


import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import Header from '../common/Header';
import Footer from '../common/Footer';
import AccountTabs from './account/AccountTabs';
import DeviceSettingsTabs from './pages/DeviceSettingsTabs';
import AsideContainer from './aside';
import ModalContainer from '../modal';
import Notifications from '../common/Notification';
import Log from '../common/Log';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from '~/flowtype';

type WalletContainerProps = {
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

type ContentProps = {
    children?: React.Node
}


const Content = (props: ContentProps) => (
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
);

const Wallet = (props: WalletContainerProps) => (
    <div className="app">
        <Header />
        {/* <div>{ props.wallet.online ? "ONLINE" : "OFFLINE" }</div> */}
        <main>
            <AsideContainer />
            <Content>
                { props.children }
            </Content>
        </main>
        <ModalContainer />
    </div>
);

const mapStateToProps: MapStateToProps<State, {}, WalletContainerProps> = (state: State, own: {}): WalletContainerProps => ({
    wallet: state.wallet,
});

export default withRouter(
    connect(mapStateToProps, null)(Wallet),
);
