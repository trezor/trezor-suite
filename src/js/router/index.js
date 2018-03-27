/* @flow */
'use strict';

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from '../store';

import { 
    LandingPageContainer,
    WalletContainer,

    AcquireContainer,
    BootloaderContainer,

    DashboardContainer,
    
    HistoryContainer,
    SendFormContainer,
    ReceiveContainer,
    SignVerifyContainer,
    SettingsContainer,
} from '../containers';

import SummaryContainer from '../components/wallet/summary/SummaryContainer';

export default (
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <Switch>
                <Route exact path="/" component={ LandingPageContainer } />
                <Route exact path="/bridge" component={ LandingPageContainer } />
                <Route exact path="/import" component={ LandingPageContainer } />
                <Route>
                    <WalletContainer>
                        <Route exact path="/device/:device/" component={ DashboardContainer } />
                        <Route exact path="/device/:device/coin/:coin" component={ DashboardContainer } />
                        <Route exact path="/device/:device/acquire" component={ AcquireContainer } />
                        <Route exact path="/device/:device/bootloader" component={ BootloaderContainer } />
                        <Route exact path="/device/:device/coin/:coin/address/:address" component={ SummaryContainer } />
                        <Route path="/device/:device/coin/:coin/address/:address/send" component={ SendFormContainer } />
                        <Route path="/device/:device/coin/:coin/address/:address/send/override" component={ SendFormContainer } />
                        <Route path="/device/:device/coin/:coin/address/:address/receive" component={ ReceiveContainer } />
                        <Route path="/device/:device/coin/:coin/address/:address/signverify" component={ SignVerifyContainer } />
                        {/* <Route path="/device/:device/address/:address/history" component={ HistoryContainer } /> */}
                        
                    </WalletContainer>
                </Route>
                <Route path="/settings" component={ SettingsContainer } />
            </Switch>
        </ConnectedRouter>
    </Provider>
);