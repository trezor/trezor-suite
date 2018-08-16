/* @flow */

import React from 'react';
import { H2 } from 'components/common/Heading';
import Header from 'components/common/Header';
import Footer from 'components/common/Footer';
import Log from 'components/common/Log';
import Notifications, { Notification } from 'components/common/Notification';

import Preloader from './components/Preloader';
import ConnectDevice from './components/ConnectDevice';
import InstallBridge from './components/InstallBridge';
import LocalStorageError from './components/LocalStorageError';
import TrezorConnectError from './components/TrezorConnectError';

import type { Props } from './index';

const BrowserNotSupported = (props: {}): React$Element<string> => (
    <main>
        <H2>Your browser is not supported</H2>
        <p>Please choose one of the supported browsers</p>
        <div className="row">
            <div className="chrome">
                <p>Google Chrome</p>
                <a className="button" href="https://www.google.com/chrome/" target="_blank" rel="noreferrer noopener">Get Chrome</a>
            </div>
            <div className="firefox">
                <p>Mozilla Firefox</p>
                <a className="button" href="https://www.mozilla.org/en-US/firefox/new/" target="_blank" rel="noreferrer noopener">Get Firefox</a>
            </div>
        </div>
    </main>
);


export default (props: Props) => {
    const { web3 } = props;
    const { devices } = props;
    const { browserState, transport } = props.connect;
    const localStorageError = props.localStorage.error;
    const connectError = props.connect.error;

    let notification = null;
    let body = null;
    let css: string = 'app landing';
    const bridgeRoute: boolean = props.router.location.state.hasOwnProperty('bridge');

    if (localStorageError) {
        notification = (
            <Notification
                title="Initialization error"
                message="Config files are missing"
                className="error"
            />
        );
        css += ' config-error';
    } else if (browserState.supported === false) {
        css += ' browser-not-supported';
        body = <BrowserNotSupported />;
    } else if (connectError || bridgeRoute) {
        css += ' install-bridge';
        body = <InstallBridge browserState={browserState} />;
    } else if (props.wallet.ready && devices.length < 1) {
        css += ' connect-device';
        body = <ConnectDevice transport={transport} disconnectRequest={props.wallet.disconnectRequest} />;
    }

    if (notification || body) {
        return (
            <div className={css}>
                <Header />
                { notification }
                <Notifications />
                <Log />
                { body }
                <Footer />
            </div>
        );
    }
    return (<Preloader />);
};
