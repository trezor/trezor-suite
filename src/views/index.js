import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

// general
import ErrorBoundary from 'support/ErrorBoundary';
import LandingContainer from 'views/Landing/Container';

// wallet views
import WalletContainer from 'views/Wallet';
import AccountSummary from 'views/Wallet/views/AccountSummary/Container';
import AccountSend from 'views/Wallet/views/AccountSend/Container';
import AccountReceive from 'views/Wallet/views/AccountReceive/Container';
import AccountSignVerify from 'views/Wallet/views/AccountSignVerify';

import WalletDashboard from 'views/Wallet/views/Dashboard';
import WalletDeviceSettings from 'views/Wallet/views/DeviceSettings';
import WalletSettings from 'views/Wallet/views/WalletSettings';
import WalletBootloader from 'views/Wallet/views/Bootloader';
import WalletInitialize from 'views/Wallet/views/Initialize';
import WalletAcquire from 'views/Wallet/views/Acquire';
import WalletUnreadableDevice from 'views/Wallet/views/UnreadableDevice';

import store, { history } from 'support/store';

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
                            <Route exact path="/device/:device/network/:network/account/:account" component={AccountSummary} />
                            <Route path="/device/:device/network/:network/account/:account/send" component={AccountSend} />
                            <Route path="/device/:device/network/:network/account/:account/send/override" component={AccountSend} />
                            <Route path="/device/:device/network/:network/account/:account/receive" component={AccountReceive} />
                            <Route path="/device/:device/network/:network/account/:account/signverify" component={AccountSignVerify} />
                        </WalletContainer>
                    </ErrorBoundary>
                </Route>
            </Switch>
        </ConnectedRouter>
    </Provider>
);

export default hot(module)(App);