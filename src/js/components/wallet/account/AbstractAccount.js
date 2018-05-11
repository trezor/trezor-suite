/* @flow */
'use strict';

import React, { Component } from 'react';
import { Notification } from '../../common/Notification';
import { findDevice } from '../../../reducers/TrezorConnectReducer';

// import * as AbstractAccountActions from '../../actions/AbstractAccountActions';
import { default as AbstractAccountActions } from '../../../actions/AbstractAccountActions';

import type { State, TrezorDevice, Action, ThunkAction } from '../../../flowtype';
import type { Account } from '../../../reducers/AccountsReducer';
import type { Discovery } from '../../../reducers/DiscoveryReducer';

export type StateProps = {
    abstractAccount: $ElementType<State, 'abstractAccount'>,
    devices: $PropertyType<$ElementType<State, 'connect'>, 'devices'>,
    discovery: $ElementType<State, 'discovery'>,
    accounts: $ElementType<State, 'accounts'>,
}

export type DispatchProps = {
    abstractAccountActions: typeof AbstractAccountActions,
    initAccount: () => ThunkAction,
    disposeAccount: () => Action,
}

export type Props = StateProps & DispatchProps;

export type AccountState = {
    device: ?TrezorDevice;
    account: ?Account;
    discovery: ?Discovery;
    deviceStatusNotification: ?React$Element<typeof Notification>;
}

export default class AbstractAccount<P> extends Component<Props & P, AccountState> {

    state: AccountState = {
        device: null,
        account: null,
        discovery: null,
        deviceStatusNotification: null
    };

    componentDidMount() {
        this.props.abstractAccountActions.init();
        this.props.initAccount();
    }

    componentWillReceiveProps(props: Props & P) {
        
        this.props.abstractAccountActions.update( this.props.initAccount );

        const accountState = props.abstractAccount;
        if (!accountState) return;

        const device = findDevice(props.devices, accountState.deviceId, accountState.deviceState, accountState.deviceInstance);
        if (!device) return;
        const discovery = props.discovery.find(d => d.deviceState === device.state && d.network === accountState.network);
        // if (!discovery) return;
        const account = props.accounts.find(a => a.deviceState === accountState.deviceState && a.index === accountState.index && a.network === accountState.network);

        let deviceStatusNotification: ?React$Element<typeof Notification> = null;
        if (account) {
            if (!device.connected) {
                deviceStatusNotification = <Notification className="info" title={ `Device ${ device.instanceLabel } is disconnected` } />;
            } else if (!device.available) {
                deviceStatusNotification = <Notification className="info" title={ `Device ${ device.instanceLabel } is unavailable` } message="Change passphrase settings to use this device" />;
            }
        }

        if (discovery && !discovery.completed && !deviceStatusNotification) {
            deviceStatusNotification = <Notification className="info" title="Loading accounts" />;
        }

        this.setState({
            device,
            discovery,
            account,
            deviceStatusNotification
        })
    }

    componentWillUnmount() {
        this.props.abstractAccountActions.dispose();
        this.props.disposeAccount();
    }

    render(): ?React$Element<string> {

        const props = this.props;
        const accountState = props.abstractAccount;

        if (!accountState) {
            return (<section><Notification className="info" title="Loading device" /></section>);
        }

        const {
            device,
            account,
            discovery
        } = this.state;
        
        if (!device) {
            return (<section>Device with state {accountState.deviceState} not found</section>);
        }

        if (!account) {
            if (!discovery || discovery.waitingForDevice) {
                if (device.connected) {
                    if (device.available) {
                        return (
                            <section>
                                <Notification className="info" title="Loading accounts..." />
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
                            <Notification 
                                className="info" 
                                title={ `Device ${ device.instanceLabel } is disconnected` } 
                                message="Connect device to load accounts"
                                />
                        </section>
                    );
                }
            } else if (discovery.waitingForBackend) {
                return (
                    <section>
                        <Notification className="warning" title="Backend not working" />
                    </section>
                );
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
        }

        return null;
    }
}