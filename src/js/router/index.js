/* @flow */
'use strict';

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from '../store';

import LandingPageContainer from '../components/landing';
import WalletContainer from '../components/wallet';
import BootloaderContainer from '../components/wallet/Bootloader';
import AcquireContainer from '../components/wallet/Acquire';

import DashboardContainer from '../components/wallet/Dashboard';
import SummaryContainer from '../components/wallet/summary';
import SendFormContainer from '../components/wallet/send';
import ReceiveContainer from '../components/wallet/Receive';
import SignVerifyContainer from '../components/wallet/SignVerify';
import DeviceSettingsContainer from '../components/wallet/DeviceSettings';
import WalletSettingsContainer from '../components/wallet/WalletSettings';

export default (
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <Switch>
                <Route exact path="/" component={ LandingPageContainer } />
                <Route exact path="/bridge" component={ LandingPageContainer } />
                <Route exact path="/import" component={ LandingPageContainer } />
                <Route>
                    <WalletContainer>
                        <Route exact path="/settings" component={ WalletSettingsContainer } />
                        <Route exact path="/device/:device/" component={ DashboardContainer } />
                        <Route exact path="/device/:device/network/:network" component={ DashboardContainer } />
                        <Route exact path="/device/:device/acquire" component={ AcquireContainer } />
                        <Route exact path="/device/:device/bootloader" component={ BootloaderContainer } />
                        <Route exact path="/device/:device/settings" component={ DeviceSettingsContainer } />
                        <Route exact path="/device/:device/network/:network/address/:address" component={ SummaryContainer } />
                        <Route path="/device/:device/network/:network/address/:address/send" component={ SendFormContainer } />
                        <Route path="/device/:device/network/:network/address/:address/send/override" component={ SendFormContainer } />
                        <Route path="/device/:device/network/:network/address/:address/receive" component={ ReceiveContainer } />
                        <Route path="/device/:device/network/:network/address/:address/signverify" component={ SignVerifyContainer } />
                    </WalletContainer>
                </Route>
            </Switch>
        </ConnectedRouter>
    </Provider>
);