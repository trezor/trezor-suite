/* @flow */
import { toggleDeviceDropdown, toggleSidebar, setHideBalance } from 'actions/WalletActions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import * as DiscoveryActions from 'actions/DiscoveryActions';
import * as RouterActions from 'actions/RouterActions';
import * as ModalActions from 'actions/ModalActions';
import type { State, Dispatch } from 'flowtype';

import type { StateProps, DispatchProps } from './components/common';

import LeftNavigation from './index';

type OwnProps = {||};

const mapStateToProps = (state: State): StateProps => ({
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
    addAccount: bindActionCreators(DiscoveryActions.addAccount, dispatch),
    acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    forgetDevice: bindActionCreators(TrezorConnectActions.forget, dispatch),
    duplicateDevice: bindActionCreators(TrezorConnectActions.duplicateDevice, dispatch),
    gotoDeviceSettings: bindActionCreators(RouterActions.gotoDeviceSettings, dispatch),
    onSelectDevice: bindActionCreators(RouterActions.selectDevice, dispatch),
    gotoExternalWallet: bindActionCreators(ModalActions.gotoExternalWallet, dispatch),
    toggleSidebar: bindActionCreators(toggleSidebar, dispatch),
    setHideBalance: bindActionCreators(setHideBalance, dispatch),
});

export default withRouter<OwnProps>(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(LeftNavigation)
);
