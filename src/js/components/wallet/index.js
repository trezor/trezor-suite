/* @flow */
'use strict';

import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import Header from '../common/Header';
import Footer from '../common/Footer';
import AccountTabs from './account/AccountTabs';
import DeviceSettingsTabs from './account/DeviceSettingsTabs';
import AsideContainer from './aside';
import ModalContainer from '../modal';
import Notifications from '../common/Notification';
import Log from '../common/Log';

import type { State, Dispatch } from '../../flowtype';

type Props = {
    children: React.Node
}

const Content = (props: Props) => {
    return (
        <article>
            <nav>
                <Route path="/device/:device/network/:network/address/:address" component={ AccountTabs } />
                <Route path="/device/:device/device-settings" component={ DeviceSettingsTabs } />
            </nav>
            <Notifications />
            <Log />
            { props.children }
            <Footer />
        </article>
    );
}

const Wallet = (props: Props) => {
    return (
        <div className="app">
            <Header />
            <main>
                <AsideContainer />
                <Content>
                    { props.children }
                </Content>
            </main>
            <ModalContainer />
        </div>
    );
}

export default withRouter(
    connect(null, null)(Wallet)
);
