import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import ErrorBoundary from 'support/ErrorBoundary';
import LandingContainer from 'views/Landing/Container';

// wallet views
import WalletContainer from 'views/Wallet';
import WalletDashboard from 'views/Wallet/views/Dashboard';
import WalletDeviceSettings from 'views/Wallet/views/DeviceSettings';
import WalletSettings from 'views/Wallet/views/WalletSettings';
import WalletBootloader from 'views/Wallet/views/Bootloader';
import WalletInitialize from 'views/Wallet/views/Initialize';
import WalletAcquire from 'views/Wallet/views/Acquire';
import WalletUnreadableDevice from 'views/Wallet/views/UnreadableDevice';

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
                            <Route exact path="/settings" component={WalletSettings} />
                            <Route exact path="/device/:device/" component={WalletDashboard} />
                            <Route exact path="/device/:device/network/:network" component={WalletDashboard} />
                            <Route exact path="/device/:device/acquire" component={WalletAcquire} />
                            <Route exact path="/device/:device/unreadable" component={WalletUnreadableDevice} />
                            <Route exact path="/device/:device/bootloader" component={WalletBootloader} />
                            <Route exact path="/device/:device/initialize" component={WalletInitialize} />
                            <Route exact path="/device/:device/settings" component={WalletDeviceSettings} />
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