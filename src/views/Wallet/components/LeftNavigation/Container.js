/* @flow */
import { toggleDeviceDropdown } from 'actions/WalletActions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import * as DiscoveryActions from 'actions/DiscoveryActions';
import * as RouterActions from 'actions/RouterActions';
import * as ModalActions from 'actions/ModalActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import type { StateProps, DispatchProps } from './components/common';

import LeftNavigation from './index';

type OwnProps = {

}

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    connect: state.connect,
    accounts: state.accounts,
    router: state.router,
    fiat: state.fiat,
    localStorage: state.localStorage,
    discovery: state.discovery,
    wallet: state.wallet,
    devices: state.devices,
    pending: state.pending,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
    addAccount: bindActionCreators(DiscoveryActions.addAccount, dispatch),
    acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    forgetDevice: bindActionCreators(TrezorConnectActions.forget, dispatch),
    duplicateDevice: bindActionCreators(TrezorConnectActions.duplicateDevice, dispatch),
    gotoDeviceSettings: bindActionCreators(RouterActions.gotoDeviceSettings, dispatch),
    onSelectDevice: bindActionCreators(RouterActions.selectDevice, dispatch),
    gotoExternalWallet: bindActionCreators(ModalActions.gotoExternalWallet, dispatch),
});

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(LeftNavigation),
);
