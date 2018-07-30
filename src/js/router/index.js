/* @flow */


import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from '../store';

import LandingPageContainer from '../components/landing';
import WalletContainer from '../components/wallet';
import BootloaderContainer from '../components/wallet/pages/Bootloader';
import InitializeContainer from '../components/wallet/pages/Initialize';
import AcquireContainer from '../components/wallet/pages/Acquire';

import DashboardContainer from '../components/wallet/pages/Dashboard';
import SummaryContainer from '../components/wallet/account/summary';
import SendFormContainer from '../components/wallet/account/send';
import ReceiveContainer from '../components/wallet/account/receive';
import SignVerifyContainer from '../components/wallet/account/sign/SignVerify';
import DeviceSettingsContainer from '../components/wallet/pages/DeviceSettings';
import WalletSettingsContainer from '../components/wallet/pages/WalletSettings';

export default (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path="/" component={LandingPageContainer} />
                <Route exact path="/bridge" component={LandingPageContainer} />
                <Route exact path="/import" component={LandingPageContainer} />
                <Route>
                    <WalletContainer>
                        <Route exact path="/settings" component={WalletSettingsContainer} />
                        <Route exact path="/device/:device/" component={DashboardContainer} />
                        <Route exact path="/device/:device/network/:network" component={DashboardContainer} />
                        <Route exact path="/device/:device/acquire" component={AcquireContainer} />
                        <Route exact path="/device/:device/bootloader" component={BootloaderContainer} />
                        <Route exact path="/device/:device/initialize" component={InitializeContainer} />
                        <Route exact path="/device/:device/settings" component={DeviceSettingsContainer} />
                        <Route exact path="/device/:device/network/:network/account/:account" component={SummaryContainer} />
                        <Route path="/device/:device/network/:network/account/:account/send" component={SendFormContainer} />
                        <Route path="/device/:device/network/:network/account/:account/send/override" component={SendFormContainer} />
                        <Route path="/device/:device/network/:network/account/:account/receive" component={ReceiveContainer} />
                        <Route path="/device/:device/network/:network/account/:account/signverify" component={SignVerifyContainer} />
                    </WalletContainer>
                </Route>
            </Switch>
        </ConnectedRouter>
    </Provider>
);