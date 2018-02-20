/* @flow */
'use strict';

import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Aside from '../components/wallet/aside/Aside';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { toggleDeviceDropdown } from '../actions/AppActions';

function mapStateToProps(state, own) {
    return {
        connect: state.connect,
        accounts: state.accounts,
        router: state.router,
        deviceDropdownOpened: state.DOM.deviceDropdownOpened,
        fiatRate: state.web3.fiatRate,
        localStorage: state.localStorage,
        discovery: state.discovery
    };
}

function mapDispatchToProps(dispatch) {
    return {
        //onAccountSelect: bindActionCreators(AccountActions.onAccountSelect, dispatch),
        toggleDeviceDropdown: bindActionCreators(toggleDeviceDropdown, dispatch),
        addAddress: bindActionCreators(TrezorConnectActions.addAddress, dispatch),
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
        forgetDevice: bindActionCreators(TrezorConnectActions.forget, dispatch),
        duplicateDevice: bindActionCreators(TrezorConnectActions.duplicateDevice, dispatch),
        onSelectDevice: bindActionCreators(TrezorConnectActions.onSelectDevice, dispatch),
    };
}

//export default connect(mapStateToProps, mapDispatchToProps)(AddressMenu);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Aside)
);