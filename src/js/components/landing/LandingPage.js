/* @flow */
'use strict';

import React from 'react';
import Preloader from './Preloader';
import ConnectDevice from './ConnectDevice';
import InstallBridge from './InstallBridge';
import LocalStorageError from './LocalStorageError';
import TrezorConnectError from './TrezorConnectError';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Log from '../common/Log';
// import { Notification } from '../common/Notification';
import Notifications, { Notification } from '../common/Notification';


const BrowserNotSupported = (props: any) => {
    return (
        <main>
            <h2>Your browser is not supported</h2>
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
    )
}

export default (props: any): any => {

    const web3 = props.web3;
    const { devices, browserState, transport } = props.connect;
    const localStorageError = props.localStorage.error;
    const connectError = props.connect.error;

    let notification = null;
    let body = null;
    let css: string = 'app landing';
    const bridgeRoute: boolean = props.router.location.params.hasOwnProperty('bridge');

    if (localStorageError) {
        notification = (<Notification 
            title="Initialization error"
            message="Config files are missing"
            className="error"
        />);
        css += ' config-error';
    } else if (browserState.supported === false) {
        css += ' browser-not-supported'
        body = <BrowserNotSupported />;
    } else if (connectError || bridgeRoute) {
        css += ' install-bridge';
        body = <InstallBridge browserState={ props.connect.browserState } />;
    } else if (web3.length > 0 && devices.length < 1) {
        css += ' connect-device';
        body = <ConnectDevice transport={ transport } />;
    }

    if (notification || body) {
        return (
            <div className={ css }>
                <Header />
                { notification }
                <Notifications />
                <Log />
                { body }
                <Footer />
            </div>
        );
    } else {
        return (<Preloader />);
    }
}
