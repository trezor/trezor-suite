/* @flow */

import * as React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import Header from 'components/Header';
import Footer from 'components/Footer';
import DeviceSettingsTabs from 'components/wallet/pages/DeviceSettingsTabs';
import ModalContainer from 'components/modal';
import Notifications from 'components/Notification';
import Log from 'components/Log';

import LeftNavigation from './components/LeftNavigation/Container';
import AccountTabs from './components/Tabs';

type WalletContainerProps = {
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

type ContentProps = {
    children?: React.Node
}

const Wallet = (props: WalletContainerProps) => (
    <div className="app">
        <Header />
        {/* <div>{ props.wallet.online ? "ONLINE" : "OFFLINE" }</div> */}
        <main>
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
