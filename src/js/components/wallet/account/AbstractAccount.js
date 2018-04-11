/* @flow */
'use strict';

import React, { Component } from 'react';
import { Notification } from '../../common/Notification';
import { findDevice } from '../../../utils/reducerUtils';
import type { TrezorDevice } from '../../../reducers/TrezorConnectReducer';

export type AccountState = {
    device: TrezorDevice;
    discovery: any;
    account: any;
}

export default class AbstractAccount extends Component {

    device: TrezorDevice;
    discovery: any;
    account: any;
    deviceStatusNotification: any;

    constructor(props: any) {
        super(props);
        this.state = {

        }
    }

    setLocalVars(vars: any) {
        this.device = vars.device;
        this.discovery = vars.discovery;
    }

    componentDidMount() {
        this.props.initAccount();
    }

    componentWillUpdate(newProps: any) {
        this.device = null;
        this.discovery = null;
        this.account = null;
        this.deviceStatusNotification = null;

        this.props.updateAccount();
    }

    componentWillUnmount() {
        this.props.disposeAccount();

        this.device = null;
        this.discovery = null;
        this.account = null;
        this.deviceStatusNotification = null;
    }

    render(state: any): any {

        const props = this.props;

        if (!state.deviceState) {
            return (<section><Notification className="info" title="Loading device" /></section>);
        }
        
        const device = findDevice(this.props.devices, state.deviceState, state.deviceId, state.deviceInstance);

        if (!device) {
            return (<section>Device with state {state.deviceState} not found</section>);
        }
        const discovery = props.discovery.find(d => d.deviceState === device.state && d.network === state.network);
        const account = props.accounts.find(a => a.deviceState === state.deviceState && a.index === state.accountIndex && a.network === state.network);
        let deviceStatusNotification = null;

        if (!account) {
            if (!discovery || discovery.waitingForDevice) {
                if (device.connected) {
                    if (device.available) {
                        return (
                            <section>
                                <Notification className="info" title="Loading account" />
                            </section>
                        );
                    } else {
                        return (
                            <section>
                                <Notification 
                                    className="info" 
                                    title={ `Device ${ device.instanceLabel } is unavailable` } 
                                    message="Change passphrase settings to use this device"
                                     />
                            </section>
                        );
                    }
                } else {
                    return (
                        <section>
                            <Notification className="info" title={ `Device ${ device.instanceLabel } is disconnected` } />
                        </section>
                    );
                }
            } else if (discovery.completed) {
                return (
                    <section>
                        <Notification className="warning" title="Account does not exist" />
                    </section>
                );
            } else {
                return (
                    <section>
                        <Notification className="info" title="Account is loading..." />
                    </section>
                );
            }
        } else {
            if (!device.connected) {
                deviceStatusNotification = <Notification className="info" title={ `Device ${ device.instanceLabel } is disconnected` } />;
            } else if (!device.available) {
                deviceStatusNotification = <Notification className="info" title={ `Device ${ device.instanceLabel } is unavailable` } message="Change passphrase settings to use this device" />;
            }
        }

        // Set class variables for extender classes
        this.device = device;
        this.discovery = discovery;
        this.account = account;
        this.deviceStatusNotification = deviceStatusNotification;

        return null;
    }
}