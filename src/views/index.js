import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

// general
import ErrorBoundary from 'support/ErrorBoundary';
import { getPattern } from 'support/routes';
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
import WalletFirmwareUpdate from 'views/Wallet/views/FirmwareUpdate';
import WalletInitialize from 'views/Wallet/views/Initialize';
import WalletAcquire from 'views/Wallet/views/Acquire';
import WalletUnreadableDevice from 'views/Wallet/views/UnreadableDevice';

import store, { history } from 'store';

const App = () => (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path={getPattern('landing-home')} component={LandingContainer} />
                <Route exact path={getPattern('landing-bridge')} component={LandingContainer} />
                <Route exact path={getPattern('landing-import')} component={LandingContainer} />
                <Route>
                    <ErrorBoundary>
                        <WalletContainer>
                            <Route exact path={getPattern('wallet-setting')} component={WalletSettings} />
                            <Route exact path={getPattern('wallet-dashboard')} component={WalletDashboard} />
                            <Route exact path={getPattern('wallet-acquire')} component={WalletAcquire} />
                            <Route exact path={getPattern('wallet-unreadable')} component={WalletUnreadableDevice} />
                            <Route exact path={getPattern('wallet-bootloader')} component={WalletBootloader} />
                            <Route exact path={getPattern('wallet-initialize')} component={WalletInitialize} />
                            <Route exact path={getPattern('wallet-device-settings')} component={WalletDeviceSettings} />
                            <Route exact path={getPattern('wallet-account-summary')} component={AccountSummary} />
                            <Route path={getPattern('wallet-account-send')} component={AccountSend} />
                            <Route path={getPattern('wallet-account-send-override')} component={AccountSend} />
                            <Route path={getPattern('wallet-account-receive')} component={AccountReceive} />
                            <Route path={getPattern('wallet-account-signverify')} component={AccountSignVerify} />
                        </WalletContainer>
                    </ErrorBoundary>
                </Route>
            </Switch>
        </ConnectedRouter>
    </Provider>
);

export default hot(module)(App);