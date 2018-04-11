/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as TrezorConnectActions from '../../../actions/TrezorConnectActions';
import { toggleDeviceDropdown } from '../../../actions/WalletActions';

import Aside from './Aside';

const mapStateToProps = (state, own) => {
    return {
        connect: state.connect,
        accounts: state.accounts,
        router: state.router,
        deviceDropdownOpened: state.wallet.dropdownOpened,
        fiat: state.fiat,
        localStorage: state.localStorage,
        discovery: state.discovery
    };
}

const mapDispatchToProps = (dispatch) => {
    return {
        //onAccountSelect: bindActionCreators(AccountActions.onAccountSelect, dispatch),
        toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
        addAddress: bindActionCreators(TrezorConnectActions.addAddress, dispatch),
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
        forgetDevice: bindActionCreators(TrezorConnectActions.forget, dispatch),
        duplicateDevice: bindActionCreators(TrezorConnectActions.duplicateDevice, dispatch),
        gotoDeviceSettings: bindActionCreators(TrezorConnectActions.gotoDeviceSettings, dispatch),
        onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch),
    };
}

//export default connect(mapStateToProps, mapDispatchToProps)(AddressMenu);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Aside)
);