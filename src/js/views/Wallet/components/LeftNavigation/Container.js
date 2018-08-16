/* @flow */
import { toggleDeviceDropdown } from 'actions/WalletActions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import type { StateProps, DispatchProps } from './common';

import LeftNavigation from './index';

type OwnProps = {

}

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

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(LeftNavigation),
);
