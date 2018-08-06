/* @flow */


import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as TrezorConnectActions from '~/js/actions/TrezorConnectActions';
import { toggleDeviceDropdown } from '~/js/actions/WalletActions';

import Aside from './Aside';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from '~/flowtype';

type OwnProps = {

}

type StateProps = {
    connect: $ElementType<State, 'connect'>,
    accounts: $ElementType<State, 'accounts'>,
    router: $ElementType<State, 'router'>,
    deviceDropdownOpened: boolean,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
    discovery: $ElementType<State, 'discovery'>,
    wallet: $ElementType<State, 'wallet'>,
    devices: $ElementType<State, 'devices'>,
    pending: $ElementType<State, 'pending'>,
}

type DispatchProps = {
    toggleDeviceDropdown: typeof toggleDeviceDropdown,
    addAccount: typeof TrezorConnectActions.addAccount,
    acquireDevice: typeof TrezorConnectActions.acquire,
    forgetDevice: typeof TrezorConnectActions.forget,
    duplicateDevice: typeof TrezorConnectActions.duplicateDevice,
    gotoDeviceSettings: typeof TrezorConnectActions.gotoDeviceSettings,
    onSelectDevice: typeof TrezorConnectActions.onSelectDevice,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => ({
    connect: state.connect,
    accounts: state.accounts,
    router: state.router,
    deviceDropdownOpened: state.wallet.dropdownOpened,
    fiat: state.fiat,
    localStorage: state.localStorage,
    discovery: state.discovery,
    wallet: state.wallet,
    devices: state.devices,
    pending: state.pending,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    //onAccountSelect: bindActionCreators(AccountActions.onAccountSelect, dispatch),
    toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
    addAccount: bindActionCreators(TrezorConnectActions.addAccount, dispatch),
    acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    forgetDevice: bindActionCreators(TrezorConnectActions.forget, dispatch),
    duplicateDevice: bindActionCreators(TrezorConnectActions.duplicateDevice, dispatch),
    gotoDeviceSettings: bindActionCreators(TrezorConnectActions.gotoDeviceSettings, dispatch),
    onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch),
});

// export default connect(mapStateToProps, mapDispatchToProps)(Aside);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Aside),
);