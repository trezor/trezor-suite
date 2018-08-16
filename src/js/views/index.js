import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import ErrorBoundary from 'support/ErrorBoundary';

import WalletContainer from 'views/Wallet';
import BootloaderContainer from 'components/wallet/pages/Bootloader';
import InitializeContainer from 'components/wallet/pages/Initialize';
import AcquireContainer from 'components/wallet/pages/Acquire';
import UnreadableDeviceContainer from 'components/wallet/pages/UnreadableDevice';

import DashboardContainer from 'components/wallet/pages/Dashboard';

import DeviceSettingsContainer from 'components/wallet/pages/DeviceSettings';
import WalletSettingsContainer from 'components/wallet/pages/WalletSettings';
import LandingContainer from 'views/Landing/Container';

import SignVerifyContainer from './Wallet/components/Sign';
import ReceiveContainer from './Wallet/components/Receive/Container';
import SendFormContainer from './Wallet/components/Send/Container';
import SummaryContainer from './Wallet/components/Summary/Container';

import store, { history } from '../store';

const App = () => (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path="/" component={LandingContainer} />
                <Route exact path="/bridge" component={LandingContainer} />
                <Route exact path="/import" component={LandingContainer} />
                <Route>
                    <ErrorBoundary>
                        <WalletContainer>
                            <Route exact path="/settings" component={WalletSettingsContainer} />
                            <Route exact path="/device/:device/" component={DashboardContainer} />
                            <Route exact path="/device/:device/network/:network" component={DashboardContainer} />
                            <Route exact path="/device/:device/acquire" component={AcquireContainer} />
                            <Route exact path="/device/:device/unreadable" component={UnreadableDeviceContainer} />
                            <Route exact path="/device/:device/bootloader" component={BootloaderContainer} />
                            <Route exact path="/device/:device/initialize" component={InitializeContainer} />
                            <Route exact path="/device/:device/settings" component={DeviceSettingsContainer} />
                            <Route exact path="/device/:device/network/:network/account/:account" component={SummaryContainer} />
                            <Route path="/device/:device/network/:network/account/:account/send" component={SendFormContainer} />
                            <Route path="/device/:device/network/:network/account/:account/send/override" component={SendFormContainer} />
                            <Route path="/device/:device/network/:network/account/:account/receive" component={ReceiveContainer} />
                            <Route path="/device/:device/network/:network/account/:account/signverify" component={SignVerifyContainer} />
                        </WalletContainer>
                    </ErrorBoundary>
                </Route>
            </Switch>
        </ConnectedRouter>
    </Provider>
);

export default hot(module)(App);