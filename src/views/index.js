import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

// general
import ErrorBoundary from 'support/ErrorBoundary';
import ImagesPreloader from 'support/ImagesPreloader';
import { getPattern } from 'support/routes';

// landing views
import RootView from 'views/Landing/views/Root/Container';
import InstallBridge from 'views/Landing/views/InstallBridge/Container';
import ImportView from 'views/Landing/views/Import/Container';

// wallet views
import WalletContainer from 'views/Wallet';
import AccountSummary from 'views/Wallet/views/Account/Summary/Container';
import AccountSend from 'views/Wallet/views/Account/Send/Container';
import AccountReceive from 'views/Wallet/views/Account/Receive/Container';
import AccountSignVerify from 'views/Wallet/views/Account/SignVerify';

import WalletDashboard from 'views/Wallet/views/Dashboard';
import WalletDeviceSettings from 'views/Wallet/views/DeviceSettings';
import WalletSettings from 'views/Wallet/views/WalletSettings';
import WalletBootloader from 'views/Wallet/views/Bootloader';
import WalletFirmwareUpdate from 'views/Wallet/views/FirmwareUpdate';
import WalletInitialize from 'views/Wallet/views/Initialize';
import WalletSeedless from 'views/Wallet/views/Seedless';
import WalletAcquire from 'views/Wallet/views/Acquire';
import WalletUnreadableDevice from 'views/Wallet/views/UnreadableDevice';

import store, { history } from 'store';

const App = () => (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path={getPattern('landing-home')} component={RootView} />
                <Route exact path={getPattern('landing-bridge')} component={InstallBridge} />
                <Route exact path={getPattern('landing-import')} component={ImportView} />
                <Route>
                    <ErrorBoundary>
                        <ImagesPreloader />
                        <WalletContainer>
                            <Route exact path={getPattern('wallet-settings')} component={WalletSettings} />
                            <Route exact path={getPattern('wallet-dashboard')} component={WalletDashboard} />
                            <Route exact path={getPattern('wallet-acquire')} component={WalletAcquire} />
                            <Route exact path={getPattern('wallet-unreadable')} component={WalletUnreadableDevice} />
                            <Route exact path={getPattern('wallet-bootloader')} component={WalletBootloader} />
                            <Route exact path={getPattern('wallet-initialize')} component={WalletInitialize} />
                            <Route exact path={getPattern('wallet-seedless')} component={WalletSeedless} />
                            <Route exact path={getPattern('wallet-firmware-update')} component={WalletFirmwareUpdate} />
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